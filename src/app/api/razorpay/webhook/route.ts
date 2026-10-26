import { NextResponse } from "next/server";
import {
  finalizeOrder,
  getOrderByRazorpayOrderId,
  getOrderByShippingLinkId,
  getOrderForPayment,
  markShippingPaid,
} from "@/lib/checkout/server";
import {
  sendNewOrderAdminEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} from "@/lib/email";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

interface PaymentEntity {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentLinkEntity {
  id: string;
  amount: number;
  amount_paid?: number;
  status: string;
  notes?: Record<string, string>;
}

interface WebhookEvent {
  event: string;
  payload: {
    payment?: { entity: PaymentEntity };
    payment_link?: { entity: PaymentLinkEntity };
  };
}

export async function POST(request: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  let valid = false;
  try {
    valid = verifyWebhookSignature(body, signature);
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(body) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event === "order.paid") {
    const payment = event.payload.payment?.entity;
    if (!payment?.order_id) {
      return NextResponse.json({ received: true });
    }

    const order = await getOrderByRazorpayOrderId(payment.order_id);
    if (!order) {
      return NextResponse.json({ received: true });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ received: true, already: true });
    }

    if (
      payment.currency !== "INR" ||
      payment.amount !== order.total_amount ||
      (payment.status !== "captured" && payment.status !== "authorized")
    ) {
      return NextResponse.json({ received: true, ignored: "mismatch" });
    }

    try {
      const finalized = await finalizeOrder({
        orderId: order.id,
        paymentId: payment.id,
        razorpayOrderId: payment.order_id,
        amount: payment.amount,
      });

      if (!finalized.already_finalized) {
        if (finalized.status === "payment_review") {
          await sendOrderStatusEmail(order.id, "payment_review").catch(
            () => undefined,
          );
        } else {
          await sendOrderConfirmationEmail(order.id).catch(() => undefined);
        }
        await sendNewOrderAdminEmail(order.id).catch(() => undefined);
      }
    } catch {
      return NextResponse.json({ error: "Could not finalize order." }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  if (event.event === "payment_link.paid") {
    const link = event.payload.payment_link?.entity;
    if (!link) {
      return NextResponse.json({ received: true });
    }

    const orderFromLink = await getOrderByShippingLinkId(link.id);
    const orderFromNotes = link.notes?.order_id
      ? await getOrderForPayment(link.notes.order_id)
      : null;
    const notesOrder =
      orderFromLink ??
      (orderFromNotes && orderFromNotes.shipping_payment_link_id === link.id
        ? orderFromNotes
        : null);

    if (!notesOrder) {
      return NextResponse.json({ received: true, ignored: "unknown_link" });
    }

    if (notesOrder.shipping_payment_status === "paid") {
      return NextResponse.json({ received: true, already: true });
    }

    const paidAmount = link.amount_paid ?? link.amount;
    if (!Number.isInteger(paidAmount) || paidAmount <= 0) {
      return NextResponse.json({ received: true, ignored: "amount" });
    }

    const marked = await markShippingPaid(
      notesOrder,
      paidAmount,
      link.id,
    );

    if (!marked) {
      return NextResponse.json({ error: "Could not record shipping payment." }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
