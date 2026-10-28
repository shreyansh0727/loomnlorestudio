import type { BuyerType, Combo, Product, ProductVariant } from "@/lib/types";
import { getComboStock } from "@/lib/pricing";
import { getEffectivePrice, variantImageUrl } from "@/lib/utils";
import type { ComboCartLine, ProductCartLine } from "@/lib/cart/types";

export function buildProductCartLine({
  product,
  variant,
  quantity,
  buyerType,
}: {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  buyerType: BuyerType;
}): ProductCartLine {
  return {
    kind: "product",
    key: `product:${variant.id}`,
    productId: product.id,
    variantId: variant.id,
    variantLabel: variant.label,
    slug: product.slug,
    name: product.name,
    imageUrl: variantImageUrl(variant) || product.images[0] || "",
    unitPrice: getEffectivePrice(product, variant, buyerType === "b2b"),
    quantity,
    unit: product.unit,
    buyerType,
    minQuantity: buyerType === "b2b" ? product.moq : 1,
    maxQuantity: variant.stock_qty,
    stockQuantity: variant.stock_qty,
  };
}

export function buildComboCartLine({
  combo,
  quantity,
  buyerType,
}: {
  combo: Combo;
  quantity: number;
  buyerType: BuyerType;
}): ComboCartLine {
  const stock = getComboStock(combo);
  return {
    kind: "combo",
    key: `combo:${combo.id}`,
    comboId: combo.id,
    slug: combo.slug,
    name: combo.title,
    imageUrl: combo.image_url ?? "",
    unitPrice: combo.bundle_price,
    quantity,
    unit: "set",
    buyerType,
    minQuantity: 1,
    maxQuantity: stock,
    stockQuantity: stock,
    components: combo.items.map((item) => ({
      name: item.product?.name ?? "Included piece",
      variantLabel: item.variant?.label ?? "",
      quantity: item.quantity,
    })),
  };
}
