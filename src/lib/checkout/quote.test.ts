import { describe, expect, it } from "vitest";
import {
  buildQuote,
  findB2CLimitBreach,
  productUsageForB2C,
} from "@/lib/checkout/quote";
import type { CheckoutQuoteLine } from "@/lib/checkout/types";
import {
  RETAIL_SHIPPING_RATES,
  retailShippingAmount,
  shippingZoneFor,
} from "@/lib/checkout/shipping";
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
    name: "Rose Garden Scrunchie",
    slug: "rose-garden-scrunchie",
    variantLabel: "Rose garden",
    sku: "SCR-ROSE-PRL",
    imageUrl: "/images/buniya/products/rose-garden-scrunchie.jpg",
    unit: "piece",
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
    comboSlug: "pastel-morning-set",
    name: "Pastel morning set",
    slug: "pastel-morning-set",
    variantLabel: null,
    sku: null,
    imageUrl: "/images/buniya/products/blush-satin-scrunchie-set.jpg",
    unit: "bundle",
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    components: [
      {
        variant_id: "b1000000-0000-4000-8000-000000000001",
        product_id: PRODUCT_ID,
        product_name: "Rose Garden Scrunchie",
        variant_label: "Rose garden",
        sku: "SCR-ROSE-PRL",
        quantity: 4,
      },
      {
        variant_id: "b1000000-0000-4000-8000-000000000011",
        product_id: "a1000000-0000-4000-8000-000000000006",
        product_name: "Pearl Embellished Headband",
        variant_label: "Pearl ivory",
        sku: "HEAD-PRL-IVRY",
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
        code: "BUNIYA10",
        label: "A little hello",
        discountAmount: 22400,
      },
    });

    expect(quote.subtotal).toBe(224000);
    expect(quote.discountAmount).toBe(22400);
    expect(quote.productTotal).toBe(201600);
    expect(quote.taxAmount).toBe(9600);
    expect(quote.totalAmount).toBe(201600);
    expect(quote.itemCount).toBe(3);
    expect(quote.coupon?.code).toBe("BUNIYA10");
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

describe("retail shipping zones", () => {
  const origin = { originCity: "Varanasi", originState: "Uttar Pradesh" };

  it("maps the delivery address to a fixed zone", () => {
    expect(
      shippingZoneFor({ ...origin, city: "Varanasi", state: "Uttar Pradesh" }),
    ).toBe("local");
    expect(
      shippingZoneFor({ ...origin, city: "Lucknow", state: "Uttar Pradesh" }),
    ).toBe("same_state");
    expect(
      shippingZoneFor({ ...origin, city: "Mumbai", state: "Maharashtra" }),
    ).toBe("other_state");
  });

  it("ignores case and extra whitespace", () => {
    expect(
      shippingZoneFor({ ...origin, city: "  varanasi ", state: "uttar  pradesh" }),
    ).toBe("local");
  });

  it("waits for a city inside the seller's state", () => {
    expect(
      shippingZoneFor({ ...origin, city: "", state: "Uttar Pradesh" }),
    ).toBeNull();
    expect(shippingZoneFor({ ...origin, city: "Varanasi", state: "" })).toBeNull();
  });

  it("charges retail orders only", () => {
    expect(retailShippingAmount("b2c", "local")).toBe(RETAIL_SHIPPING_RATES.local);
    expect(retailShippingAmount("b2c", "same_state")).toBe(RETAIL_SHIPPING_RATES.same_state);
    expect(retailShippingAmount("b2c", "other_state")).toBe(RETAIL_SHIPPING_RATES.other_state);
    expect(retailShippingAmount("b2c", null)).toBe(0);
    expect(retailShippingAmount("b2b", "other_state")).toBe(0);
  });

  it("adds shipping to the total after the coupon without changing tax", () => {
    const build = (shippingZone: "local" | "same_state" | "other_state" | null) =>
      buildQuote({
        lines: [productLine(1, 100000)],
        buyerType: "b2c",
        gstRate: 5,
        coupon: null,
        shippingZone,
      });

    const base = build(null);
    const local = build("local");

    expect(base.totalAmount).toBe(base.productTotal);
    expect(local.shippingAmount).toBe(6000);
    expect(local.shippingZone).toBe("local");
    expect(local.totalAmount).toBe(base.totalAmount + 6000);
    expect(local.taxAmount).toBe(base.taxAmount);
  });

  it("keeps wholesale totals free of shipping", () => {
    const quote = buildQuote({
      lines: [productLine(10, 60000)],
      buyerType: "b2b",
      gstRate: 5,
      coupon: null,
      shippingZone: "other_state",
    });

    expect(quote.shippingAmount).toBe(0);
    expect(quote.shippingZone).toBeNull();
    expect(quote.totalAmount).toBe(quote.productTotal);
  });
});

describe("B2C product limits", () => {
  it("counts combo components toward the retail product cap", () => {
    const usage = productUsageForB2C([productLine(2, 68000), comboLine(2, 250000)]);
    const scrunchie = usage.find((entry) => entry.productId === PRODUCT_ID);

    expect(scrunchie?.quantity).toBe(2 + 4 * 2);
  });

  it("flags a breach across separate product and combo lines", () => {
    const breach = findB2CLimitBreach([
      productLine(4, 68000),
      comboLine(2, 250000),
    ]);

    expect(breach).toEqual({
      productId: PRODUCT_ID,
      name: "Rose Garden Scrunchie",
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

  it("accepts an optional delivery city and state for shipping quotes", () => {
    const parsed = checkoutQuoteSchema.safeParse({
      lines: [line(1)],
      city: "Varanasi",
      state: "Uttar Pradesh",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.city).toBe("Varanasi");
      expect(parsed.data.state).toBe("Uttar Pradesh");
    }
  });
});
