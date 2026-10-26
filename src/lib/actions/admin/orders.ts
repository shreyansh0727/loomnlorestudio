"use server";

import { revalidatePath } from "next/cache";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  adminActionContext,
  databaseMessage,
  firstIssue,
  flagged,
  rupeesToPaise,
  text,
} from "@/lib/admin/helpers";
import {
  createShippingPaymentLink,
} from "@/lib/shipping";
import {
  orderNoteSchema,
  orderStatusUpdateSchema,
  orderTrackingSchema,
  shippingQuoteSchema,
} from "@/lib/validation-admin";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "@/lib/email";
import type { FormState } from "@/lib/form-state";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

function refreshOrder(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/account/orders");
  revalidatePath("/account");
}

export async function updateOrderStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const orderId = text(formData, "orderId").trim();
  if (!orderId) return { status: "error", message: "That order could not be found." };

  const parsed = orderStatusUpdateSchema.safeParse({
    status: text(formData, "status"),
    note: text(formData, "note"),
    notify: flagged(formData, "notify"),
    refundAmount: rupeesToPaise(formData, "refundAmount") ?? null,
    refundReference: text(formData, "refundReference"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const { data: orderRow, error: readError } = await context.admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (readError || !orderRow) {
    return { status: "error", message: "That order could not be found." };
  }
  const order = orderRow as unknown as Order;
  const status = parsed.data.status;

  if (
    order.status === "payment_review" &&
    ["confirmed", "processing", "packed", "shipped", "delivered"].includes(status)
  ) {
    return {
      status: "error",
      message:
        "This order is waiting on a stock review. Restock the shortfall, then use “Allocate stock & issue invoice” before moving it forward.",
    };
  }

  if (order.status === status && !parsed.data.note) {
    return { status: "success", message: "That status is already current." };
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status };

  if (status === "shipped" && !order.shipped_at) update.shipped_at = now;
  if (status === "delivered" && !order.delivered_at) update.delivered_at = now;
  if (status === "cancelled" && !order.cancelled_at) update.cancelled_at = now;

  let refundNote = "";
  if (status === "refunded") {
    const amountPaid = order.amount_paid || order.product_total;
    const refundAmount = parsed.data.refundAmount ?? amountPaid;
    if (refundAmount <= 0) {
      return { status: "error", message: "Enter the amount refunded to the customer." };
    }
    if (refundAmount > amountPaid) {
      return {
        status: "error",
        message: `The refund cannot exceed the amount paid (${formatMoney(amountPaid)}).`,
      };
    }
    update.refunded_at = now;
    update.refund_amount = refundAmount;
    update.refund_reference = parsed.data.refundReference;
    update.payment_status =
      refundAmount >= amountPaid ? "refunded" : "partially_refunded";
    refundNote = ` Refund of ${formatMoney(refundAmount)} recorded.`;
  }

  if (parsed.data.note) {
    update.internal_notes = [order.internal_notes, parsed.data.note]
      .filter(Boolean)
      .join("\n\n");
  }

  const { error: updateError } = await context.admin
    .from("orders")
    .update(update)
    .eq("id", orderId);
  if (updateError) return { status: "error", message: databaseMessage(updateError) };

  await context.admin.from("order_events").insert({
    order_id: orderId,
    event_type: "status_change",
    status,
    message:
      `Status changed from ${ORDER_STATUS_LABELS[order.status]} to ${ORDER_STATUS_LABELS[status]}.` +
      (parsed.data.note ? ` Note: ${parsed.data.note}` : ""),
    created_by: context.viewer.user?.id ?? null,
  });

  if (status === "refunded" && update.refund_amount) {
    await context.admin.from("order_events").insert({
      order_id: orderId,
      event_type: "refund_recorded",
      status,
      message: `Refund of ${formatMoney(Number(update.refund_amount))} recorded${
        parsed.data.refundReference ? ` (${parsed.data.refundReference})` : ""
      }.`,
      created_by: context.viewer.user?.id ?? null,
    });
  }

  let stockNote = "";
  if (status === "cancelled" || status === "refunded") {
    const { data: restored, error: restoreError } = await context.admin.rpc(
      "restore_order_stock",
      { p_order_id: orderId },
    );
    if (restoreError) {
      stockNote = " Reserved stock could not be restored automatically — check inventory.";
    } else if ((restored as { restored?: boolean } | null)?.restored) {
      stockNote = " Reserved stock was returned to inventory.";
    }
  }

  refreshOrder(orderId);

  if (!parsed.data.notify) {
    return {
      status: "success",
      message: `Order marked ${ORDER_STATUS_LABELS[status].toLowerCase()}.${refundNote}${stockNote}`,
    };
  }

  const email = await sendOrderStatusEmail(orderId, status as OrderStatus).catch(() => null);
  if (!email || email.status === "failed") {
    return {
      status: "success",
      message: `Status updated, but the email could not be sent.${refundNote}${stockNote}`,
    };
  }
  if (email.status === "skipped") {
    return {
      status: "success",
      message: `Status updated. Email is not configured, so the customer was not notified.${refundNote}${stockNote}`,
    };
  }

  return {
    status: "success",
    message: `Status updated and the customer was emailed.${refundNote}${stockNote}`,
  };
}

export async function resolvePaymentReviewAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const orderId = text(formData, "orderId").trim();
  if (!orderId) return { status: "error", message: "That order could not be found." };

  const { data: orderRow, error: readError } = await context.admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (readError || !orderRow) {
    return { status: "error", message: "That order could not be found." };
  }
  const order = orderRow as unknown as Order;

  if (order.status !== "payment_review" || order.payment_status !== "paid") {
    return { status: "error", message: "This order is not awaiting a stock review." };
  }

  const { data, error } = await context.admin.rpc("finalize_paid_order", {
    p_order_id: orderId,
    p_payment_id: order.razorpay_payment_id ?? `review_${order.order_number}`,
    p_razorpay_order_id: order.razorpay_order_id,
    p_amount: order.total_amount,
  });
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshOrder(orderId);

  const result = data as
    | { status?: string; invoice_number?: string | null }
    | null;
  if (result?.status !== "confirmed") {
    return {
      status: "error",
      message:
        "Stock is still insufficient. Replenish the affected variants, then try again.",
    };
  }

  const invoice = result.invoice_number ?? "issued";
  const email = await sendOrderConfirmationEmail(orderId).catch(() => null);
  if (!email || email.status === "failed") {
    return {
      status: "success",
      message: `Stock allocated and invoice ${invoice} issued, but the confirmation email could not be sent.`,
    };
  }
  if (email.status === "skipped") {
    return {
      status: "success",
      message: `Stock allocated and invoice ${invoice} issued. Email is not configured, so the customer was not notified.`,
    };
  }

  return {
    status: "success",
    message: `Stock allocated, invoice ${invoice} issued and the customer emailed.`,
  };
}

export async function updateOrderTrackingAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const orderId = text(formData, "orderId").trim();
  const parsed = orderTrackingSchema.safeParse({
    carrier: text(formData, "carrier"),
    trackingNumber: text(formData, "trackingNumber"),
    trackingUrl: text(formData, "trackingUrl"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const { error } = await context.admin
    .from("orders")
    .update({
      shipping_carrier: parsed.data.carrier,
      tracking_number: parsed.data.trackingNumber,
      tracking_url: parsed.data.trackingUrl,
    })
    .eq("id", orderId);
  if (error) return { status: "error", message: databaseMessage(error) };

  await context.admin.from("order_events").insert({
    order_id: orderId,
    event_type: "note",
    status: null,
    message: `Tracking saved · ${parsed.data.carrier} ${parsed.data.trackingNumber}.`,
    created_by: context.viewer.user?.id ?? null,
  });

  refreshOrder(orderId);
  return { status: "success", message: "Tracking details saved." };
}

export async function createShippingLinkAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const orderId = text(formData, "orderId").trim();
  const amount = rupeesToPaise(formData, "amount");
  const parsed = shippingQuoteSchema.safeParse({ amount: amount ?? 0 });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const result = await createShippingPaymentLink({
    orderId,
    amountPaise: parsed.data.amount,
  });
  if (!result.ok) return { status: "error", message: result.message };

  refreshOrder(orderId);
  revalidatePath(`/order`, "layout");
  return {
    status: "success",
    message: result.emailed
      ? "Payment link created and emailed to the customer."
      : "Payment link created. Email is not configured, so copy the link to the customer.",
  };
}

export async function addOrderNoteAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const orderId = text(formData, "orderId").trim();
  const parsed = orderNoteSchema.safeParse({ note: text(formData, "note") });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const { error } = await context.admin.from("order_events").insert({
    order_id: orderId,
    event_type: "note",
    status: null,
    message: parsed.data.note,
    created_by: context.viewer.user?.id ?? null,
  });
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshOrder(orderId);
  return { status: "success", message: "Internal note added." };
}

export async function resendOrderEmailAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const orderId = text(formData, "orderId").trim();
  const template = text(formData, "template", "confirmation");

  if (template === "confirmation") {
    const result = await sendOrderConfirmationEmail(orderId);
    if (result.status === "failed") {
      return { status: "error", message: "Resend rejected the email. Check the logs." };
    }
    if (result.status === "skipped") {
      return { status: "error", message: "Email is not configured — add Resend keys first." };
    }
    refreshOrder(orderId);
    return { status: "success", message: "Confirmation email sent again." };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) return { status: "error", message: "Supabase is unavailable." };
  const { data: order } = await admin
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { status: "error", message: "That order could not be found." };

  const result = await sendOrderStatusEmail(orderId, order.status as OrderStatus);
  if (result.status === "failed") {
    return { status: "error", message: "Resend rejected the email. Check the logs." };
  }
  if (result.status === "skipped") {
    return { status: "error", message: "Email is not configured — add Resend keys first." };
  }
  refreshOrder(orderId);
  return { status: "success", message: "Status email sent again." };
}
