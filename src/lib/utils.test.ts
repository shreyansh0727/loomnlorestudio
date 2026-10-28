import { describe, expect, it } from "vitest";
import type { ProductVariant } from "@/lib/types";
import { variantImageUrl } from "@/lib/utils";

function variant(attributes: Record<string, string>): ProductVariant {
  return {
    id: "variant-1",
    product_id: "product-1",
    label: "Rose garden",
    sku: null,
    stock_qty: 3,
    retail_price_override: null,
    wholesale_price_override: null,
    is_active: true,
    sort_order: 0,
    attributes,
  };
}

describe("variantImageUrl", () => {
  it("reads the linked image from attributes", () => {
    expect(variantImageUrl(variant({ image_url: " /images/rose.jpg " }))).toBe(
      "/images/rose.jpg",
    );
  });

  it("returns an empty string when no image is linked", () => {
    expect(variantImageUrl(variant({ colour: "Rose" }))).toBe("");
    expect(variantImageUrl(null)).toBe("");
  });
});
