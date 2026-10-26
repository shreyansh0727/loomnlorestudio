import "server-only";

import type { Address, BuyerType, Order, Viewer } from "@/lib/types";
import type {
  CheckoutCouponSummary,
  CheckoutQuote,
  CheckoutQuoteLine,
} from "@/lib/checkout/types";
import type { CheckoutDetailsInput, CheckoutQuoteInput } from "@/lib/validation";
import { resolveCheckoutCoupon, resolveCheckoutLines, toAddress } from "@/lib/checkout/catalog";
import { buildQuote } from "@/lib/checkout/quote";
import { shippingZoneFor } from "@/lib/checkout/shipping";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/data/content";

export function buyerTypeForViewer(viewer: Viewer): BuyerType {
  return viewer.isB2B && viewer.business?.status === "approved" ? "b2b" : "b2c";
}

export async function quoteForViewer({
  input,
  viewer,
  email,
}: {
  input: CheckoutQuoteInput;
  viewer: Viewer;
  email: string;
}): Promise<{ quote: CheckoutQuote; couponError: string | null }> {
  const buyerType = buyerTypeForViewer(viewer);
  const [lines, settings] = await Promise.all([
    resolveCheckoutLines(input.lines, buyerType),
    getSiteSettings(),
  ]);

  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  let coupon: CheckoutCouponSummary | null = null;
  let couponError: string | null = null;

  if (input.couponCode) {
    const result = await resolveCheckoutCoupon({
      code: input.couponCode,
      buyerType,
      subtotal,
      email: email || viewer.user?.email || "",
    });

    if ("error" in result) couponError = result.error;
    else coupon = result.summary;
  }

  return {
    quote: buildQuote({
      lines,
      buyerType,
      gstRate: settings.gstRate,
      coupon,
      shippingZone:
        buyerType === "b2c"
          ? shippingZoneFor({
              city: input.city,
              state: input.state,
              originCity: settings.sellerAddress.city,
              originState: settings.sellerAddress.state,
            })
          : null,
    }),
    couponError,
  };
}

function orderItemMetadata(line: CheckoutQuoteLine) {
  if (line.kind === "combo") {
    return {
      combo_id: line.comboId,
      combo_slug: line.comboSlug,
      components: line.components,
    };
  }
  return {};
}

export async function createPendingOrder({
  viewer,
  details,
  quote,
  coupon,
}: {
  viewer: Viewer;
  details: CheckoutDetailsInput;
  quote: CheckoutQuote;
  coupon: CheckoutCouponSummary | null;
}): Promise<Order> {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    throw new Error("Missing the Supabase service role key.");
  }

  const business = quote.buyerType === "b2b" ? viewer.business : null;
  const shippingAddress: Address = toAddress({
    fullName: details.fullName,
    email: details.email,
    phone: details.phone,
    addressLine1: details.addressLine1,
    addressLine2: details.addressLine2,
    city: details.city,
    state: details.state,
    pincode: details.pincode,
  });

  const billingAddress: Address = business
    ? {
        full_name: business.legal_name,
        email: business.email,
        phone: business.phone,
        line1: business.address_line1,
        line2: business.address_line2,
        city: business.city,
        state: business.state,
        pincode: business.pincode,
        country: "India",
      }
    : shippingAddress;

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: viewer.user?.id ?? null,
      customer_name: details.fullName,
      email: details.email,
      phone: details.phone,
      buyer_type: quote.buyerType,
      business_id: business?.id ?? null,
      business_legal_name: business?.legal_name ?? null,
      business_gstin: business?.gstin ?? null,
      status: "pending_payment",
      payment_status: "pending",
      shipping_payment_status: "not_required",
      subtotal: quote.subtotal,
      discount_amount: quote.discountAmount,
      shipping_amount: quote.shippingAmount,
      product_total: quote.productTotal,
      tax_rate: quote.taxRate,
      tax_amount: quote.taxAmount,
      total_amount: quote.totalAmount,
      amount_paid: 0,
      coupon_id: coupon?.id ?? null,
      coupon_code: coupon?.code ?? null,
      coupon_label: coupon?.label ?? null,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      customer_note: details.customerNote,
    })
    .select("*")
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? "Could not create the order.");
  }

  const typedOrder = order as unknown as Order;

  const { error: itemsError } = await admin.from("order_items").insert(
    quote.lines.map((line) => ({
      order_id: typedOrder.id,
      product_id: line.productId,
      variant_id: line.variantId,
      combo_id: line.comboId,
      item_type: line.kind,
      name: line.name,
      variant_label: line.variantLabel,
      sku: line.sku,
      image_url: line.imageUrl,
      unit_price: line.unitPrice,
      quantity: line.quantity,
      line_total: line.lineTotal,
      metadata: orderItemMetadata(line),
    })),
  );

  if (itemsError) {
    await admin
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        internal_notes: `Checkout failed while saving order items: ${itemsError.message}`,
      })
      .eq("id", typedOrder.id);
    throw new Error("Could not save the order items.");
  }

  await admin.from("order_events").insert({
    order_id: typedOrder.id,
    event_type: "order_created",
    status: "pending_payment",
    message: "Order placed. Awaiting online payment.",
  });

  return typedOrder;
}

export async function cancelPendingOrder(orderId: string, reason: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return;

  await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      internal_notes: reason,
    })
    .eq("id", orderId)
    .eq("status", "pending_payment");

  await admin.from("order_events").insert({
    order_id: orderId,
    event_type: "status_change",
    status: "cancelled",
    message: "Checkout could not be completed. The order was released before payment.",
  });
}

export interface FinalizeResult {
  status: "confirmed" | "payment_review";
  order_id: string;
  order_number: string;
  access_token: string;
  invoice_number?: string | null;
  already_finalized?: boolean;
  shortfall?: unknown;
}

export async function finalizeOrder({
  orderId,
  paymentId,
  razorpayOrderId,
  amount,
}: {
  orderId: string;
  paymentId: string;
  razorpayOrderId: string | null;
  amount: number;
}): Promise<FinalizeResult> {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) throw new Error("Missing the Supabase service role key.");

  const { data, error } = await admin.rpc("finalize_paid_order", {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_razorpay_order_id: razorpayOrderId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as FinalizeResult;
}

export async function getOrderForPayment(orderId: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Order;
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Order;
}

export async function getOrderByShippingLinkId(linkId: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("shipping_payment_link_id", linkId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Order;
}

export async function markShippingPaid(order: Order, amount: number, paymentId: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return false;

  const totalAmount = order.subtotal - order.discount_amount + amount;

  const { error } = await admin
    .from("orders")
    .update({
      shipping_amount: amount,
      shipping_payment_status: "paid",
      razorpay_shipping_payment_id: paymentId,
      total_amount: totalAmount,
      amount_paid: order.product_total + amount,
    })
    .eq("id", order.id);

  if (error) return false;

  await admin.from("order_events").insert({
    order_id: order.id,
    event_type: "shipping_payment_received",
    status: order.status,
    message: "Shipping payment received via Razorpay.",
  });

  return true;
}
