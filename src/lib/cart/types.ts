import type { BuyerType } from "@/lib/types";

export interface CartComponent {
  name: string;
  variantLabel: string;
  quantity: number;
}

interface CartLineBase {
  key: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  buyerType: BuyerType;
  minQuantity: number;
  maxQuantity: number;
  stockQuantity: number;
}

export interface ProductCartLine extends CartLineBase {
  kind: "product";
  productId: string;
  variantId: string;
  variantLabel: string;
}

export interface ComboCartLine extends CartLineBase {
  kind: "combo";
  comboId: string;
  components: CartComponent[];
}

export type CartLine = ProductCartLine | ComboCartLine;

export type CartSelection =
  | { kind: "product"; variantId: string; quantity: number }
  | { kind: "combo"; comboId: string; quantity: number };
