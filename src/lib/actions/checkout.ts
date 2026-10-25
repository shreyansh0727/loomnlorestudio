"use server";

import { getViewer } from "@/lib/auth";
import { RAZORPAY_THEME_COLOR } from "@/lib/constants";
import { getSiteSettings } from "@/lib/data/content";
import { isRazorpayConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  cancelPendingOrder,
  createPendingOrder,
  finalizeOrder,
  getOrderForPayment,
  quoteForViewer,
} from "@/lib/checkout/server";
import { CheckoutError } from "@/lib/checkout/catalog";
import type {
  CheckoutLineInput,
  CheckoutQuoteResult,
  StartCheckoutResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@/lib/checkout/types";
import {
  checkoutDetailsSchema,
  checkoutQuoteSchema,
  emailOnlySchema,
} from "@/lib/validation";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "@/lib/email";

const CONFIG_MESSAGE =
  "Online payments are not connected yet. Add your Supabase service role key and Razorpay test keys to .env.local, then restart the app.";

async function notifyFinalizedOrder(
  orderId: string,
  status: "confirmed" | "payment_review",
) {
  if (status === "payment_review") {
    await sendOrderStatusEmail(orderId, "payment_review").catch(() => undefined);
    return;
  }
  await sendOrderConfirmationEmail(orderId).catch(() => undefined);
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the details and try again.";
}

function quoteInputFrom(rawLines: unknown, rawCoupon: unknown) {
  return checkoutQuoteSchema.safeParse({
    lines: rawLines,
    couponCode: typeof rawCoupon === "string" ? rawCoupon : "",
  });
}

function checkoutInputFrom(input: {
  lines: unknown;
  couponCode?: unknown;
  fullName: unknown;
  email: unknown;
  phone: unknown;
  addressLine1: unknown;
  addressLine2?: unknown;
  city: unknown;
  state: unknown;
  pincode: unknown;
  customerNote?: unknown;
  terms: unknown;
}) {
  return checkoutDetailsSchema.safeParse({
    lines: input.lines,
    couponCode: typeof input.couponCode === "string" ? input.couponCode : "",
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2:
      typeof input.addressLine2 === "string" ? input.addressLine2 : "",
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    customerNote:
      typeof input.customerNote === "string" ? input.customerNote : "",
    terms: input.terms,
  });
}

export async function quoteCheckoutAction(input: {
  lines: CheckoutLineInput[];
  couponCode?: string | null;
  email?: string | null;
}): Promise<CheckoutQuoteResult> {
  const parsed = quoteInputFrom(input.lines, input.couponCode);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error), field: "lines" };
  }

  const viewer = await getViewer();
  let email = viewer.user?.email ?? "";
  if (input.email) {
    const parsedEmail = emailOnlySchema.safeParse({ email: input.email });
    if (parsedEmail.success) email = parsedEmail.data.email;
  }

  try {
    const { quote, couponError } = await quoteForViewer({
      input: parsed.data,
      viewer,
      email,
    });
    return { ok: true, quote, couponError };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, message: error.message, field: error.field };
    }
    return {
      ok: false,
      message: "We could not check your bag right now. Please try again in a moment.",
      field: "form",
    };
  }
}

export async function startCheckoutAction(input: {
  lines: CheckoutLineInput[];
  couponCode?: string | null;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  customerNote?: string;
  terms: boolean;
}): Promise<StartCheckoutResult> {
  const parsed = checkoutInputFrom(input);
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error), field: "form" };
  }

  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, message: CONFIG_MESSAGE, field: "form" };
  }
  if (!isRazorpayConfigured) {
    return { ok: false, message: CONFIG_MESSAGE, field: "form" };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    return { ok: false, message: CONFIG_MESSAGE, field: "form" };
  }

  const viewer = await getViewer();

  try {
    const { quote, couponError } = await quoteForViewer({
      input: { lines: parsed.data.lines, couponCode: parsed.data.couponCode },
      viewer,
      email: parsed.data.email,
    });

    if (couponError) {
      return { ok: false, message: couponError, field: "coupon" };
    }

    const order = await createPendingOrder({
      viewer,
      details: parsed.data,
      quote,
      coupon: quote.coupon,
    });

    const receipt = {
      orderId: order.id,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      totalAmount: quote.totalAmount,
    };

    if (quote.totalAmount === 0) {
      const finalized = await finalizeOrder({
        orderId: order.id,
        paymentId: `free_${order.order_number}`,
        razorpayOrderId: null,
        amount: 0,
      });
      await notifyFinalizedOrder(order.id, finalized.status);
      return {
        ok: true,
        mode: "free",
        receipt: { ...receipt, accessToken: finalized.access_token },
      };
    }

    let razorpayOrderId: string;
    try {
      const razorpayOrder = await createRazorpayOrder({
        amount: quote.totalAmount,
        receipt: order.order_number,
        notes: {
          order_id: order.id,
          order_number: order.order_number,
          buyer_type: quote.buyerType,
        },
      });
      razorpayOrderId = razorpayOrder.id;
    } catch {
      await cancelPendingOrder(
        order.id,
        "Razorpay order could not be created. No payment was attempted.",
      );
      return {
        ok: false,
        message:
          "We could not open the secure payment window. No payment was taken — please try again.",
        field: "form",
      };
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({ razorpay_order_id: razorpayOrderId })
      .eq("id", order.id);

    if (updateError) {
      await cancelPendingOrder(
        order.id,
        "Razorpay order created but could not be linked to the order.",
      );
      return {
        ok: false,
        message: "We could not prepare the payment. Please try again.",
        field: "form",
      };
    }

    const settings = await getSiteSettings();
    return {
      ok: true,
      mode: "razorpay",
      payment: {
        keyId: process.env.RAZORPAY_KEY_ID ?? "",
        razorpayOrderId,
        amount: quote.totalAmount,
        currency: "INR",
        name: settings.brandName,
        description: `${order.order_number} · ${quote.itemCount} ${
          quote.itemCount === 1 ? "piece" : "pieces"
        }`,
        prefill: {
          name: parsed.data.fullName,
          email: parsed.data.email,
          contact: parsed.data.phone,
        },
        themeColor: RAZORPAY_THEME_COLOR,
      },
      receipt,
    };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, message: error.message, field: error.field };
    }
    return {
      ok: false,
      message:
        "We could not place the order. No payment was taken. Please check your details and try again.",
      field: "form",
    };
  }
}

export async function verifyCheckoutPaymentAction(
  input: VerifyPaymentInput,
): Promise<VerifyPaymentResult> {
  if (!isRazorpayConfigured) {
    return { ok: false, message: "Payments are not configured." };
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
  if (
    !orderId ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature ||
    typeof orderId !== "string" ||
    typeof razorpayOrderId !== "string" ||
    typeof razorpayPaymentId !== "string" ||
    typeof razorpaySignature !== "string"
  ) {
    return { ok: false, message: "The payment response was incomplete." };
  }

  const order = await getOrderForPayment(orderId);
  if (!order) {
    return { ok: false, message: "That order could not be found." };
  }

  if (order.razorpay_order_id !== razorpayOrderId) {
    return {
      ok: false,
      message: "This payment does not match the order.",
    };
  }

  if (order.payment_status === "paid") {
    return {
      ok: true,
      accessToken: order.access_token,
      orderNumber: order.order_number,
      status: order.status === "payment_review" ? "payment_review" : "confirmed",
    };
  }

  if (order.status !== "pending_payment") {
    return {
      ok: false,
      message: "This order is no longer awaiting payment.",
      accessToken: order.access_token,
    };
  }

  if (
    !verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      signature: razorpaySignature,
    })
  ) {
    return {
      ok: false,
      message:
        "We could not verify this payment. If money has left your account, write to us with your order number.",
      accessToken: order.access_token,
    };
  }

  try {
    let payment = await fetchRazorpayPayment(razorpayPaymentId);

    if (payment.status === "authorized") {
      payment = await captureRazorpayPayment(razorpayPaymentId, payment.amount);
    }

    if (payment.status !== "captured") {
      return {
        ok: false,
        message:
          "Razorpay has not captured this payment yet. Please wait a moment and check your order page.",
        accessToken: order.access_token,
      };
    }

    if (
      payment.order_id !== razorpayOrderId ||
      payment.currency !== "INR" ||
      payment.amount !== order.product_total
    ) {
      return {
        ok: false,
        message:
          "The captured amount does not match this order. Please write to us before retrying.",
        accessToken: order.access_token,
      };
    }

    const finalized = await finalizeOrder({
      orderId: order.id,
      paymentId: payment.id,
      razorpayOrderId,
      amount: payment.amount,
    });

    if (!finalized.already_finalized) {
      await notifyFinalizedOrder(order.id, finalized.status);
    }

    return {
      ok: true,
      accessToken: finalized.access_token,
      orderNumber: finalized.order_number,
      status: finalized.status === "payment_review" ? "payment_review" : "confirmed",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "We could not confirm the payment. Please check your order page in a moment.",
      accessToken: order.access_token,
    };
  }
}
