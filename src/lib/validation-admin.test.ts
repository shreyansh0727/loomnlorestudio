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

describe("productInputSchema variant images", () => {
  const withVariantImage = (imageUrl: unknown) =>
    productInputSchema.safeParse({
      ...product,
      tags: [],
      variants: [{ ...product.variants[0], imageUrl }],
    });

  it("accepts site paths, full URLs and blanks", () => {
    expect(withVariantImage("/images/rose.jpg").success).toBe(true);
    expect(withVariantImage("https://cdn.example.com/rose.jpg").success).toBe(true);
    expect(withVariantImage("").success).toBe(true);
  });

  it("rejects links that are neither a path nor a full URL", () => {
    const result = withVariantImage("rose.jpg");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Use a full https:// URL or a site path starting with /.",
    );
  });
});
