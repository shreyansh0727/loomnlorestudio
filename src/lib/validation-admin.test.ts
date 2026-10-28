import { describe, expect, it } from "vitest";
import { PRODUCT_TAG_MAX_LENGTH } from "@/lib/constants";
import { productInputSchema } from "@/lib/validation-admin";

const product = {
  name: "Table runner",
  slug: "table-runner",
  categoryId: "8f2b0f3a-1111-4222-8333-944455556666",
  shortDescription: null,
  description: null,
  retailPrice: 120_000,
  compareAtPrice: null,
  wholesalePrice: null,
  moq: 1,
  unit: "piece" as const,
  images: [],
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  variants: [
    {
      label: "Natural",
      sku: null,
      stockQty: 4,
      retailOverride: null,
      wholesaleOverride: null,
      isActive: true,
    },
  ],
};

describe("productInputSchema tags", () => {
  it("accepts tags up to the limit", () => {
    const tag = "a".repeat(PRODUCT_TAG_MAX_LENGTH);
    expect(productInputSchema.safeParse({ ...product, tags: [tag] }).success).toBe(true);
  });

  it("explains the per-tag limit instead of surfacing a raw Zod message", () => {
    const result = productInputSchema.safeParse({
      ...product,
      tags: ["a".repeat(PRODUCT_TAG_MAX_LENGTH + 1)],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["tags", 0]);
    expect(result.error?.issues[0]?.message).toBe(
      `Keep each tag to ${PRODUCT_TAG_MAX_LENGTH} characters or fewer.`,
    );
  });
});
