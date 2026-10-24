import "server-only";

import type {
  Address,
  BuyerType,
  Combo,
  Coupon,
  OrderItemComponent,
  Product,
} from "@/lib/types";
import type {
  CheckoutCouponSummary,
  CheckoutLineInput,
  CheckoutQuoteLine,
} from "@/lib/checkout/types";
import {
  demoCombos,
  demoCoupons,
  demoProducts,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import { isB2BAudience, isScheduleActive, unitLabel } from "@/lib/utils";
import {
  calculateCouponDiscount,
  isCouponInSchedule,
} from "@/lib/pricing";
import { findB2CLimitBreach } from "@/lib/checkout/quote";

export class CheckoutError extends Error {
  field: "coupon" | "lines" | "form";

  constructor(message: string, field: "coupon" | "lines" | "form" = "form") {
    super(message);
    this.name = "CheckoutError";
    this.field = field;
  }
}

interface VariantRow {
  id: string;
  label: string;
  sku: string | null;
  stock_qty: number;
  retail_price_override: number | null;
  wholesale_price_override: number | null;
  is_active: boolean;
  product: Pick<
    Product,
    | "id"
    | "name"
    | "slug"
    | "retail_price"
    | "wholesale_price"
    | "moq"
    | "unit"
    | "images"
    | "is_active"
  > | null;
}

interface ComboRow {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  bundle_price: number;
  audience: Combo["audience"];
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  items: {
    quantity: number;
    variant: VariantRow | null;
  }[];
}

function variantPrice(variant: VariantRow, buyerType: BuyerType) {
  const product = variant.product;
  if (!product) return 0;
  if (buyerType === "b2b") {
    return (
      variant.wholesale_price_override ??
      product.wholesale_price ??
      variant.retail_price_override ??
      product.retail_price
    );
  }
  return variant.retail_price_override ?? product.retail_price;
}

function productLine({
  variant,
  quantity,
  buyerType,
}: {
  variant: VariantRow;
  quantity: number;
  buyerType: BuyerType;
}): CheckoutQuoteLine {
  if (!variant.product) {
    throw new CheckoutError(
      "One of the pieces in your bag is no longer available. Please update your bag.",
      "lines",
    );
  }

  const product = variant.product;
  if (quantity > variant.stock_qty) {
    throw new CheckoutError(
      `${product.name} has only ${variant.stock_qty} ${unitLabel(
        product.unit,
        variant.stock_qty,
      )} available. Please update your bag.`,
      "lines",
    );
  }

  if (buyerType === "b2b" && quantity < product.moq) {
    throw new CheckoutError(
      `${product.name} has a trade minimum of ${product.moq} ${unitLabel(
        product.unit,
        product.moq,
      )}.`,
      "lines",
    );
  }

  const unitPrice = variantPrice(variant, buyerType);

  return {
    key: `product:${variant.id}`,
    kind: "product",
    productId: product.id,
    variantId: variant.id,
    comboId: null,
    comboSlug: null,
    name: product.name,
    slug: product.slug,
    variantLabel: variant.label,
    sku: variant.sku,
    imageUrl: product.images[0] ?? "",
    unit: product.unit,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    components: [],
  };
}

function comboLine({
  combo,
  quantity,
  buyerType,
}: {
  combo: ComboRow;
  quantity: number;
  buyerType: BuyerType;
}): CheckoutQuoteLine {
  if (!isScheduleActive(combo.starts_at, combo.ends_at)) {
    throw new CheckoutError(
      `${combo.title} is not available right now. Please update your bag.`,
      "lines",
    );
  }
  if (!isB2BAudience(combo.audience, buyerType)) {
    throw new CheckoutError(
      `${combo.title} is not available for this account type.`,
      "lines",
    );
  }

  let maximum = Number.POSITIVE_INFINITY;
  const components: OrderItemComponent[] = [];

  for (const item of combo.items) {
    const variant = item.variant;
    const product = variant?.product;
    if (!variant || !product || !variant.is_active || !product.is_active) {
      throw new CheckoutError(
        `${combo.title} contains a piece that is no longer available. Please update your bag.`,
        "lines",
      );
    }

    maximum = Math.min(maximum, Math.floor(variant.stock_qty / item.quantity));
    components.push({
      variant_id: variant.id,
      product_id: product.id,
      product_name: product.name,
      variant_label: variant.label,
      sku: variant.sku,
      quantity: item.quantity,
    });
  }

  if (!Number.isFinite(maximum) || maximum < 1) {
    throw new CheckoutError(
      `${combo.title} is currently out of stock. Please update your bag.`,
      "lines",
    );
  }

  if (quantity > maximum) {
    throw new CheckoutError(
      `Only ${maximum} ${maximum === 1 ? "set" : "sets"} of ${combo.title} are available.`,
      "lines",
    );
  }

  return {
    key: `combo:${combo.id}`,
    kind: "combo",
    productId: null,
    variantId: null,
    comboId: combo.id,
    comboSlug: combo.slug,
    name: combo.title,
    slug: combo.slug,
    variantLabel: "Bundle",
    sku: null,
    imageUrl: combo.image_url ?? "",
    unit: "set",
    unitPrice: combo.bundle_price,
    quantity,
    lineTotal: combo.bundle_price * quantity,
    components,
  };
}

function mergeInputs(inputs: CheckoutLineInput[]) {
  const merged = new Map<string, CheckoutLineInput>();

  for (const input of inputs) {
    const key = `${input.kind}:${input.id}`;
    const existing = merged.get(key);
    merged.set(key, {
      kind: input.kind,
      id: input.id,
      quantity: (existing?.quantity ?? 0) + input.quantity,
    });
  }

  return [...merged.values()];
}

function demoVariant(variantId: string) {
  for (const product of demoProducts) {
    const variant = product.variants.find((candidate) => candidate.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

function resolveDemoLines(
  inputs: CheckoutLineInput[],
  buyerType: BuyerType,
): CheckoutQuoteLine[] {
  return inputs.map((input) => {
    if (input.kind === "product") {
      const match = demoVariant(input.id);
      if (!match) {
        throw new CheckoutError(
          "One of the pieces in your bag is no longer available. Please update your bag.",
          "lines",
        );
      }

      const line = productLine({
        variant: {
          ...match.variant,
          product: match.product,
        },
        quantity: input.quantity,
        buyerType,
      });
      return line;
    }

    const combo = demoCombos.find((candidate) => candidate.id === input.id);
    if (!combo) {
      throw new CheckoutError(
        "One of the bundles in your bag is no longer available. Please update your bag.",
        "lines",
      );
    }

    const comboRow: ComboRow = {
      id: combo.id,
      title: combo.title,
      slug: combo.slug,
      image_url: combo.image_url,
      bundle_price: combo.bundle_price,
      audience: combo.audience,
      is_active: combo.is_active,
      starts_at: combo.starts_at,
      ends_at: combo.ends_at,
      items: combo.items.map((item) => {
        const match = demoVariant(item.variant_id);
        return {
          quantity: item.quantity,
          variant: match
            ? {
                ...match.variant,
                product: match.product,
              }
            : null,
        };
      }),
    };

    if (!comboRow.is_active) {
      throw new CheckoutError(
        `${combo.title} is not available right now. Please update your bag.`,
        "lines",
      );
    }

    return comboLine({ combo: comboRow, quantity: input.quantity, buyerType });
  });
}

function applyRetailLimit(lines: CheckoutQuoteLine[]) {
  const breach = findB2CLimitBreach(lines);
  if (breach) {
    throw new CheckoutError(
      `Retail orders are limited to 10 units per product. Your bag contains ${breach.quantity} units of ${breach.name}.`,
      "lines",
    );
  }
}

export async function resolveCheckoutLines(
  inputs: CheckoutLineInput[],
  buyerType: BuyerType,
): Promise<CheckoutQuoteLine[]> {
  const merged = mergeInputs(inputs);

  if (!isSupabaseConfigured) {
    const lines = resolveDemoLines(merged, buyerType);
    if (buyerType === "b2c") applyRetailLimit(lines);
    return lines;
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    throw new CheckoutError(
      "The studio store is not fully connected. Add the Supabase service role key to enable checkout.",
      "form",
    );
  }

  const productInputs = merged.filter((input) => input.kind === "product");
  const comboInputs = merged.filter((input) => input.kind === "combo");

  const [variantsResult, combosResult] = await Promise.all([
    productInputs.length
      ? admin
          .from("product_variants")
          .select(
            "id,label,sku,stock_qty,retail_price_override,wholesale_price_override,is_active,product:products(id,name,slug,retail_price,wholesale_price,moq,unit,images,is_active)",
          )
          .in("id", productInputs.map((input) => input.id))
      : Promise.resolve({ data: [], error: null }),
    comboInputs.length
      ? admin
          .from("combos")
          .select(
            "id,title,slug,image_url,bundle_price,audience,is_active,starts_at,ends_at,items:combo_items(quantity,variant:product_variants(id,label,sku,stock_qty,retail_price_override,wholesale_price_override,is_active,product:products(id,name,slug,retail_price,wholesale_price,moq,unit,images,is_active)))",
          )
          .in("id", comboInputs.map((input) => input.id))
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (variantsResult.error || combosResult.error) {
    throw new CheckoutError(
      "We could not check the bag right now. Please try again in a moment.",
      "form",
    );
  }

  const variantRows = (variantsResult.data ?? []) as unknown as VariantRow[];
  const comboRows = (combosResult.data ?? []) as unknown as ComboRow[];
  const variants = new Map(variantRows.map((row) => [row.id, row]));
  const combos = new Map(comboRows.map((row) => [row.id, row]));

  const lines = merged.map((input) => {
    if (input.kind === "product") {
      const variant = variants.get(input.id);
      if (!variant || !variant.is_active || !variant.product?.is_active) {
        throw new CheckoutError(
          "One of the pieces in your bag is no longer available. Please update your bag.",
          "lines",
        );
      }
      return productLine({ variant, quantity: input.quantity, buyerType });
    }

    const combo = combos.get(input.id);
    if (!combo || !combo.is_active) {
      throw new CheckoutError(
        "One of the bundles in your bag is no longer available. Please update your bag.",
        "lines",
      );
    }
    return comboLine({ combo, quantity: input.quantity, buyerType });
  });

  if (buyerType === "b2c") applyRetailLimit(lines);
  return lines;
}

export async function resolveCheckoutCoupon({
  code,
  buyerType,
  subtotal,
  email,
}: {
  code: string;
  buyerType: BuyerType;
  subtotal: number;
  email: string;
}): Promise<{ coupon: Coupon; summary: CheckoutCouponSummary } | { error: string }> {
  const normalized = code.trim().toUpperCase();

  if (!isSupabaseConfigured) {
    const demoCoupon = demoCoupons.find((coupon) => coupon.code === normalized);
    if (!demoCoupon) {
      return { error: "That coupon code was not recognised." };
    }
    if (!isCouponInSchedule(demoCoupon)) {
      return { error: "That offer has ended." };
    }
    if (!isB2BAudience(demoCoupon.audience, buyerType)) {
      return { error: "That code is not available for this account type." };
    }
    if (subtotal < demoCoupon.min_order_amount) {
      return {
        error: `This code needs a bag of at least ₹${Math.round(
          demoCoupon.min_order_amount / 100,
        ).toLocaleString("en-IN")}.`,
      };
    }

    return {
      coupon: demoCoupon,
      summary: {
        id: demoCoupon.id,
        code: demoCoupon.code,
        label: demoCoupon.label,
        discountAmount: calculateCouponDiscount(demoCoupon, subtotal),
      },
    };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    return { error: "Coupon checks are temporarily unavailable." };
  }

  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .ilike("code", normalized)
    .maybeSingle();

  if (error) {
    return { error: "We could not check that code right now. Please try again." };
  }
  if (!data) {
    return { error: "That coupon code was not recognised." };
  }

  const coupon = data as Coupon;

  if (!coupon.is_active) {
    return { error: "That offer is no longer active." };
  }
  if (!isCouponInSchedule(coupon)) {
    return { error: "That offer has ended." };
  }
  if (!isB2BAudience(coupon.audience, buyerType)) {
    return { error: "That code is not available for this account type." };
  }
  if (subtotal < coupon.min_order_amount) {
    return {
      error: `This code needs a bag of at least ₹${Math.round(
        coupon.min_order_amount / 100,
      ).toLocaleString("en-IN")}.`,
    };
  }

  if (coupon.usage_limit || coupon.per_customer_limit) {
    const { count, error: usageError } = await admin
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);

    if (usageError) {
      return { error: "We could not check that code right now. Please try again." };
    }

    if (coupon.usage_limit && (count ?? 0) >= coupon.usage_limit) {
      return { error: "That code has reached its redemption limit." };
    }

    if (coupon.per_customer_limit) {
      const { count: personalCount, error: personalError } = await admin
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("email", email.trim().toLowerCase());

      if (personalError) {
        return { error: "We could not check that code right now. Please try again." };
      }
      if ((personalCount ?? 0) >= coupon.per_customer_limit) {
        return { error: "You have already used this code." };
      }
    }
  }

  if (coupon.first_order_only) {
    const { count, error: orderError } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("email", email.trim().toLowerCase())
      .eq("payment_status", "paid");

    if (orderError) {
      return { error: "We could not check that code right now. Please try again." };
    }
    if ((count ?? 0) > 0) {
      return { error: "This welcome code is only valid on a first order." };
    }
  }

  return {
    coupon,
    summary: {
      id: coupon.id,
      code: coupon.code,
      label: coupon.label,
      discountAmount: calculateCouponDiscount(coupon, subtotal),
    },
  };
}

export function toAddress({
  fullName,
  email,
  phone,
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
}: {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
}): Address {
  return {
    full_name: fullName,
    email,
    phone,
    line1: addressLine1,
    line2: addressLine2,
    city,
    state,
    pincode,
    country: "India",
  };
}
