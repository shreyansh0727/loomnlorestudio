import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscount,
  calculateInclusiveTax,
  getB2CMaxForProduct,
  getMaxQuantityForLine,
} from "@/lib/pricing";
import type { Coupon } from "@/lib/types";

function coupon(overrides: Partial<Coupon>): Coupon {
  return {
    id: "coupon-1",
    code: "TEST",
    label: null,
    description: null,
    discount_type: "percentage",
    discount_value: 10,
    max_discount_amount: null,
    min_order_amount: 0,
    audience: "all",
    is_active: true,
    starts_at: null,
    ends_at: null,
    usage_limit: null,
    per_customer_limit: null,
    first_order_only: false,
    is_public: false,
    show_in_offers: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("calculateCouponDiscount", () => {
  it("calculates a percentage discount in paise", () => {
    expect(calculateCouponDiscount(coupon({ discount_value: 10 }), 200000)).toBe(
      20000,
    );
  });

  it("caps a percentage discount at the maximum", () => {
    expect(
      calculateCouponDiscount(
        coupon({ discount_value: 10, max_discount_amount: 60000 }),
        2000000,
      ),
    ).toBe(60000);
  });

  it("does not discount more than the subtotal for a fixed coupon", () => {
    expect(
      calculateCouponDiscount(
        coupon({ discount_type: "fixed", discount_value: 50000 }),
        30000,
      ),
    ).toBe(30000);
  });

  it("returns zero for an empty subtotal", () => {
    expect(calculateCouponDiscount(coupon({}), 0)).toBe(0);
  });
});

describe("calculateInclusiveTax", () => {
  it("extracts the GST component from a tax-inclusive total", () => {
    expect(calculateInclusiveTax(105000, 5)).toEqual({
      inclusiveTotal: 105000,
      taxableValue: 100000,
      taxAmount: 5000,
      cgst: 2500,
      sgst: 2500,
    });
  });

  it("returns no tax when the rate is zero", () => {
    expect(calculateInclusiveTax(105000, 0)).toMatchObject({
      taxAmount: 0,
      cgst: 0,
      sgst: 0,
      taxableValue: 105000,
    });
  });

  it("handles empty or negative totals", () => {
    expect(calculateInclusiveTax(0, 5).taxAmount).toBe(0);
    expect(calculateInclusiveTax(-100, 5)).toMatchObject({
      inclusiveTotal: 0,
      taxableValue: 0,
      taxAmount: 0,
    });
  });
});

describe("B2C quantity limits", () => {
  it("limits a retail line by remaining headroom and stock", () => {
    expect(
      getMaxQuantityForLine({
        buyerType: "b2c",
        stock: 50,
        otherQuantityForProduct: 8,
      }),
    ).toBe(2);
    expect(
      getMaxQuantityForLine({
        buyerType: "b2c",
        stock: 50,
        otherQuantityForProduct: 10,
      }),
    ).toBe(0);
  });

  it("does not impose the retail cap on trade buyers", () => {
    expect(
      getMaxQuantityForLine({
        buyerType: "b2b",
        stock: 500,
        otherQuantityForProduct: 40,
      }),
    ).toBe(500);
  });

  it("caps the product total across the bag", () => {
    expect(getB2CMaxForProduct(4, 30)).toBe(6);
    expect(getB2CMaxForProduct(10, 30)).toBe(0);
  });
});
