import "server-only";

import crypto from "node:crypto";
import {
  getRazorpayCredentials,
  getRazorpayWebhookSecret,
} from "@/lib/server-env";

const API_BASE = "https://api.razorpay.com/v1";

interface RazorpayErrorBody {
  error?: { description?: string; code?: string };
}

async function razorpayRequest<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & RazorpayErrorBody)
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      payload?.error?.description ?? "Razorpay could not complete this request.",
    );
  }

  return payload;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string | null;
}

export async function createRazorpayOrder({
  amount,
  receipt,
  notes,
}: {
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  return razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: {
      amount,
      currency: "INR",
      receipt,
      notes,
    },
  });
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  captured?: boolean;
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
  });
}

export async function captureRazorpayPayment(paymentId: string, amount: number) {
  return razorpayRequest<RazorpayPayment>(
    `/payments/${encodeURIComponent(paymentId)}/capture`,
    {
      method: "POST",
      body: { amount, currency: "INR" },
    },
  );
}

function safeEqual(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  signature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayCredentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(body: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", getRazorpayWebhookSecret())
    .update(body)
    .digest("hex");
  return safeEqual(expected, signature);
}

export interface RazorpayPaymentLink {
  id: string;
  short_url: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createRazorpayPaymentLink({
  amount,
  description,
  orderId,
  orderNumber,
  customer,
  callbackUrl,
}: {
  amount: number;
  description: string;
  orderId: string;
  orderNumber: string;
  customer: { name: string; email: string; contact: string };
  callbackUrl: string;
}) {
  return razorpayRequest<RazorpayPaymentLink>("/payment_links", {
    method: "POST",
    body: {
      amount,
      currency: "INR",
      accept_partial: false,
      description,
      customer,
      notify: { email: false, sms: false },
      reminder_enable: false,
      notes: {
        order_id: orderId,
        order_number: orderNumber,
        kind: "shipping",
      },
      callback_url: callbackUrl,
      callback_method: "get",
    },
  });
}
