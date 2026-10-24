import { describe, expect, it } from "vitest";
import {
  buildQuote,
  findB2CLimitBreach,
  productUsageForB2C,
} from "@/lib/checkout/quote";
import type { CheckoutQuoteLine } from "@/lib/checkout/types";
import { checkoutQuoteSchema } from "@/lib/validation";
import { MAX_B2C_QUANTITY } from "@/lib/constants";

const PRODUCT_ID = "a1000000-0000-4000-8000-000000000001";
const COMBO_ID = "c0000000-0000-4000-8000-000000000001";

function productLine(quantity: number, unitPrice: number): CheckoutQuoteLine {
  return {
    key: `product-${quantity}`,
    kind: "product",
    productId: PRODUCT_ID,
    variantId: "b1000000-0000-4000-8000-000000000001",
    comboId: null,
    comboSlug: null,
    name: "Kala cotton yardage",
    slug: "kala-cotton-yardage",
    variantLabel: "Natural / 44 in",
    sku: "KALA-NAT-44",
    imageUrl: "/images/products/kala-cotton.jpg",
    unit: "metre",
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    components: [],
  };
}

function comboLine(quantity: number, unitPrice: number): CheckoutQuoteLine {
  return {
    key: "combo-1",
    kind: "combo",
    productId: null,
    variantId: null,
    comboId: COMBO_ID,
    comboSlug: "the-weekend-set",
    name: "The weekend set",
    slug: "the-weekend-set",
    variantLabel: null,
    sku: null,
    imageUrl: "/images/combos/weekend-set.jpg",
    unit: "bundle",
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    components: [
      {
        variant_id: "b1000000-0000-4000-8000-000000000001",
        product_id: PRODUCT_ID,
        product_name: "Kala cotton yardage",
        variant_label: "Natural / 44 in",
        sku: "KALA-NAT-44",
        quantity: 4,
      },
      {
        variant_id: "b1000000-0000-4000-8000-000000000004",
        product_id: "a1000000-0000-4000-8000-000000000002",
        product_name: "Indigo dabu yardage",
        variant_label: "Indigo / 44 in",
        sku: "DABU-IND-44",
        quantity: 2,
      },
    ],
  };
}

describe("buildQuote", () => {
  it("adds lines, applies the coupon and extracts inclusive GST", () => {
    const quote = buildQuote({
      lines: [productLine(2, 68000), productLine(1, 88000)],
      buyerType: "b2c",
      gstRate: 5,
      coupon: {
        id: "coupon-1",
        code: "FIRSTWEAVE",
        label: "First-order welcome",
        discountAmount: 22400,
      },
    });

    expect(quote.subtotal).toBe(224000);
    expect(quote.discountAmount).toBe(22400);
    expect(quote.productTotal).toBe(201600);
    expect(quote.taxAmount).toBe(9600);
    expect(quote.totalAmount).toBe(201600);
    expect(quote.itemCount).toBe(3);
    expect(quote.coupon?.code).toBe("FIRSTWEAVE");
  });

  it("never discounts below zero", () => {
    const quote = buildQuote({
      lines: [productLine(1, 5000)],
      buyerType: "b2c",
      gstRate: 5,
      coupon: {
        id: "coupon-2",
        code: "BIG",
        label: null,
        discountAmount: 9000,
      },
    });

    expect(quote.discountAmount).toBe(5000);
    expect(quote.productTotal).toBe(0);
    expect(quote.totalAmount).toBe(0);
  });

  it("drops a zero-value coupon from the quote summary", () => {
    const quote = buildQuote({
      lines: [productLine(1, 5000)],
      buyerType: "b2b",
      gstRate: 5,
      coupon: {
        id: "coupon-3",
        code: "ZERO",
        label: null,
        discountAmount: 0,
      },
    });

    expect(quote.coupon).toBeNull();
    expect(quote.discountAmount).toBe(0);
  });
});

describe("B2C product limits", () => {
  it("counts combo components toward the retail product cap", () => {
    const usage = productUsageForB2C([productLine(2, 68000), comboLine(2, 250000)]);
    const kala = usage.find((entry) => entry.productId === PRODUCT_ID);

    expect(kala?.quantity).toBe(2 + 4 * 2);
  });

  it("flags a breach across separate product and combo lines", () => {
    const breach = findB2CLimitBreach([
      productLine(4, 68000),
      comboLine(2, 250000),
    ]);

    expect(breach).toEqual({
      productId: PRODUCT_ID,
      name: "Kala cotton yardage",
      quantity: 12,
    });
  });

  it("allows exactly the retail maximum", () => {
    expect(findB2CLimitBreach([productLine(MAX_B2C_QUANTITY, 68000)])).toBeNull();
  });

  it("returns no breach for an empty bag", () => {
    expect(findB2CLimitBreach([])).toBeNull();
  });
});

describe("checkout quantity validation", () => {
  const line = (quantity: number) => ({
    kind: "product" as const,
    id: PRODUCT_ID,
    quantity,
  });

  it("rejects zero, negative and fractional quantities", () => {
    expect(checkoutQuoteSchema.safeParse({ lines: [line(0)] }).success).toBe(false);
    expect(checkoutQuoteSchema.safeParse({ lines: [line(-2)] }).success).toBe(false);
    expect(checkoutQuoteSchema.safeParse({ lines: [line(1.5)] }).success).toBe(false);
  });

  it("rejects an empty bag", () => {
    expect(checkoutQuoteSchema.safeParse({ lines: [] }).success).toBe(false);
  });

  it("accepts a whole-number quantity and leaves the retail cap to quoting", () => {
    const parsed = checkoutQuoteSchema.safeParse({
      lines: [line(MAX_B2C_QUANTITY + 1)],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.lines[0].quantity).toBe(MAX_B2C_QUANTITY + 1);
    }
  });
});
