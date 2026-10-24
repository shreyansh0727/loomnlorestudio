import type { Combo, Coupon } from "@/lib/types";
import { MAX_B2C_QUANTITY } from "@/lib/constants";

export function calculateCouponDiscount(coupon: Coupon, subtotal: number) {
  if (subtotal <= 0) return 0;

  let discount =
    coupon.discount_type === "percentage"
      ? Math.floor((subtotal * coupon.discount_value) / 100)
      : coupon.discount_value;

  if (coupon.max_discount_amount) {
    discount = Math.min(discount, coupon.max_discount_amount);
  }

  return Math.max(0, Math.min(discount, subtotal));
}

export function isCouponInSchedule(coupon: Coupon, now = new Date()) {
  if (!coupon.is_active) return false;
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return false;
  if (coupon.ends_at && new Date(coupon.ends_at) < now) return false;
  return true;
}

export interface TaxBreakdown {
  inclusiveTotal: number;
  taxableValue: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
}

export function calculateInclusiveTax(
  inclusiveTotal: number,
  ratePercent: number,
): TaxBreakdown {
  if (inclusiveTotal <= 0 || ratePercent <= 0) {
    return {
      inclusiveTotal: Math.max(0, inclusiveTotal),
      taxableValue: Math.max(0, inclusiveTotal),
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
    };
  }

  const taxAmount = Math.round(
    (inclusiveTotal * ratePercent) / (100 + ratePercent),
  );
  const cgst = Math.round(taxAmount / 2);

  return {
    inclusiveTotal,
    taxableValue: inclusiveTotal - taxAmount,
    taxAmount,
    cgst,
    sgst: taxAmount - cgst,
  };
}

export function getComboRetailValue(combo: Combo) {
  return combo.items.reduce(
    (total, item) => total + (item.product?.retail_price ?? 0) * item.quantity,
    0,
  );
}

export function getComboStock(combo: Combo) {
  if (!combo.items.length) return 0;
  return Math.min(
    ...combo.items.map((item) =>
      Math.floor((item.variant?.stock_qty ?? 0) / item.quantity),
    ),
  );
}

export function getMaxQuantityForLine({
  buyerType,
  stock,
  otherQuantityForProduct = 0,
}: {
  buyerType: "b2c" | "b2b";
  stock: number;
  otherQuantityForProduct?: number;
}) {
  if (buyerType === "b2c") {
    return Math.max(
      0,
      Math.min(stock, MAX_B2C_QUANTITY - otherQuantityForProduct),
    );
  }
  return Math.max(0, stock);
}

export function getB2CMaxForProduct(
  currentTotalForProduct: number,
  stock: number,
) {
  return Math.max(
    0,
    Math.min(stock, MAX_B2C_QUANTITY - currentTotalForProduct),
  );
}
