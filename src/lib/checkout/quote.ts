import type { BuyerType } from "@/lib/types";
import { MAX_B2C_QUANTITY } from "@/lib/constants";
import { calculateInclusiveTax } from "@/lib/pricing";
import {
  retailShippingAmount,
  type ShippingZone,
} from "@/lib/checkout/shipping";
import type {
  CheckoutCouponSummary,
  CheckoutQuote,
  CheckoutQuoteLine,
} from "@/lib/checkout/types";

export function productUsageForB2C(lines: CheckoutQuoteLine[]) {
  const usage = new Map<string, { name: string; quantity: number }>();

  function add(productId: string, name: string, quantity: number) {
    const existing = usage.get(productId);
    usage.set(productId, {
      name,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }

  for (const line of lines) {
    if (line.kind === "product" && line.productId) {
      add(line.productId, line.name, line.quantity);
      continue;
    }

    for (const component of line.components) {
      if (!component.product_id) continue;
      add(
        component.product_id,
        component.product_name,
        component.quantity * line.quantity,
      );
    }
  }

  return [...usage.entries()].map(([productId, value]) => ({
    productId,
    ...value,
  }));
}

export function findB2CLimitBreach(lines: CheckoutQuoteLine[]) {
  if (!lines.length) return null;
  return (
    productUsageForB2C(lines).find(
      (entry) => entry.quantity > MAX_B2C_QUANTITY,
    ) ?? null
  );
}

export function buildQuote({
  lines,
  buyerType,
  gstRate,
  coupon,
  shippingZone = null,
}: {
  lines: CheckoutQuoteLine[];
  buyerType: BuyerType;
  gstRate: number;
  coupon: CheckoutCouponSummary | null;
  shippingZone?: ShippingZone | null;
}): CheckoutQuote {
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const discountAmount = Math.min(coupon?.discountAmount ?? 0, subtotal);
  const productTotal = Math.max(0, subtotal - discountAmount);
  const tax = calculateInclusiveTax(productTotal, gstRate);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const applicableZone = buyerType === "b2c" ? shippingZone : null;
  const shippingAmount = retailShippingAmount(buyerType, applicableZone);

  return {
    buyerType,
    lines,
    itemCount,
    subtotal,
    discountAmount,
    productTotal,
    shippingAmount,
    shippingZone: applicableZone,
    taxRate: gstRate,
    taxAmount: tax.taxAmount,
    totalAmount: productTotal + shippingAmount,
    coupon: coupon && discountAmount > 0 ? { ...coupon, discountAmount } : null,
  };
}
