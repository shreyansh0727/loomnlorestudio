import "server-only";

import { absoluteUrl, formatMoney } from "@/lib/utils";
import { isRazorpayConfigured } from "@/lib/env";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import { createRazorpayPaymentLink } from "@/lib/razorpay";
import { getOrderForPayment } from "@/lib/checkout/server";
import { sendShippingPaymentEmail } from "@/lib/email";

export type ShippingLinkResult =
  | {
      ok: true;
      paymentUrl: string;
      paymentLinkId: string;
      emailed: boolean;
    }
  | { ok: false; message: string };

export async function createShippingPaymentLink({
  orderId,
  amountPaise,
}: {
  orderId: string;
  amountPaise: number;
}): Promise<ShippingLinkResult> {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    return { ok: false, message: "Enter a shipping amount greater than zero." };
  }
  if (!isRazorpayConfigured) {
    return {
      ok: false,
      message: "Add your Razorpay keys to create shipping payment links.",
    };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    return {
      ok: false,
      message: "Add the Supabase service role key to create shipping payment links.",
    };
  }

  const order = await getOrderForPayment(orderId);
  if (!order) return { ok: false, message: "Order not found." };
  if (order.payment_status !== "paid") {
    return {
      ok: false,
      message: "Shipping can only be quoted after the product payment is received.",
    };
  }
  if (order.status === "payment_review") {
    return {
      ok: false,
      message: "Resolve the stock review before requesting shipping payment.",
    };
  }
  if (order.shipping_payment_status === "paid") {
    return { ok: false, message: "Shipping has already been paid for this order." };
  }
  if (order.buyer_type === "b2c" && order.shipping_amount > 0) {
    return {
      ok: false,
      message: "Retail shipping is fixed and already included in the order total.",
    };
  }

  try {
    const link = await createRazorpayPaymentLink({
      amount: amountPaise,
      description: `Shipping for order ${order.order_number}`,
      orderId: order.id,
      orderNumber: order.order_number,
      customer: {
        name: order.customer_name,
        email: order.email,
        contact: order.phone,
      },
      callbackUrl: absoluteUrl(`/order/${order.access_token}`),
    });

    const totalAmount = order.subtotal - order.discount_amount + amountPaise;

    const { error } = await admin
      .from("orders")
      .update({
        shipping_amount: amountPaise,
        total_amount: totalAmount,
        shipping_payment_status: "pending",
        shipping_payment_link_id: link.id,
        shipping_payment_link_url: link.short_url,
      })
      .eq("id", order.id);

    if (error) {
      return { ok: false, message: "Could not save the shipping payment link." };
    }

    await admin.from("order_events").insert({
      order_id: order.id,
      event_type: "shipping_payment_requested",
      status: order.status,
      message: `Shipping of ${formatMoney(amountPaise)} quoted. A secure Razorpay link was sent to the customer.`,
    });

    const email = await sendShippingPaymentEmail({
      orderId: order.id,
      amount: amountPaise,
      paymentUrl: link.short_url,
    });

    return {
      ok: true,
      paymentUrl: link.short_url,
      paymentLinkId: link.id,
      emailed: email.status === "sent",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Razorpay could not create the shipping payment link.",
    };
  }
}
