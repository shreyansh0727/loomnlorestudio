import "server-only";

import type { BuyerType, Combo, ComboItem, Coupon, OfferCard } from "@/lib/types";
import { demoCombos, demoCoupons, demoProducts } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClientSafe } from "@/lib/supabase/server";

function hydrateDemoCombo(combo: Combo): Combo {
  const items = combo.items.map((item) => {
    const product = demoProducts.find((candidate) =>
      candidate.variants.some((variant) => variant.id === item.variant_id),
    );
    const variant = product?.variants.find((candidate) => candidate.id === item.variant_id);
    return {
      ...item,
      product: product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            images: product.images,
            retail_price: product.retail_price,
          }
        : null,
      variant: variant
        ? {
            id: variant.id,
            label: variant.label,
            sku: variant.sku,
            stock_qty: variant.stock_qty,
          }
        : null,
    };
  });

  const retailValue = items.reduce(
    (total, item) => total + (item.product?.retail_price ?? 0) * item.quantity,
    0,
  );

  return { ...combo, items, retail_value: retailValue };
}

type ComboItemRow = Omit<ComboItem, "product" | "variant"> & {
  variant?: {
    id: string;
    label: string;
    sku: string | null;
    stock_qty: number;
    product?: ComboItem["product"];
  } | null;
};

type ComboQueryRow = Omit<Combo, "items"> & {
  items?: ComboItemRow[];
};

function hydrateComboRow(row: ComboQueryRow): Combo {
  const items: ComboItem[] = (row.items ?? []).map((item) => ({
    id: item.id,
    combo_id: item.combo_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    product: item.variant?.product ?? null,
    variant: item.variant
      ? {
          id: item.variant.id,
          label: item.variant.label,
          sku: item.variant.sku,
          stock_qty: item.variant.stock_qty,
        }
      : null,
  }));

  const retailValue = items.reduce(
    (total, item) => total + (item.product?.retail_price ?? 0) * item.quantity,
    0,
  );

  return { ...(row as Combo), items, retail_value: retailValue };
}

export async function getPublicCombos(options?: {
  showInOffersOnly?: boolean;
  limit?: number;
  buyerType?: BuyerType;
}): Promise<Combo[]> {
  if (!isSupabaseConfigured) {
    let combos = demoCombos.filter((combo) => combo.is_active).map(hydrateDemoCombo);
    if (options?.showInOffersOnly) combos = combos.filter((combo) => combo.show_in_offers);
    if (options?.buyerType) {
      combos = combos.filter(
        (combo) =>
          combo.audience === "all" || combo.audience === options.buyerType,
      );
    }
    return combos
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, options?.limit ?? combos.length);
  }

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return [];

  let query = supabase
    .from("combos")
    .select(
      "*, items:combo_items(*, variant:product_variants(id,label,sku,stock_qty,product:products(id,name,slug,images,retail_price)))",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (options?.showInOffersOnly) query = query.eq("show_in_offers", true);
  if (options?.buyerType) {
    query = query.in("audience", ["all", options.buyerType]);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load combos: ${error.message}`);

  const combos = ((data ?? []) as unknown as ComboQueryRow[])
    .map(hydrateComboRow)
    .filter(
      (combo) => combo.items.length > 0 && combo.items.every((item) => item.variant),
    );

  return typeof options?.limit === "number"
    ? combos.slice(0, options.limit)
    : combos;
}

export async function getPublicCoupons(options?: {
  showInOffersOnly?: boolean;
  buyerType?: BuyerType;
}): Promise<Coupon[]> {
  if (!isSupabaseConfigured) {
    let coupons = demoCoupons.filter((coupon) => coupon.is_active && coupon.is_public);
    if (options?.showInOffersOnly) coupons = coupons.filter((coupon) => coupon.show_in_offers);
    if (options?.buyerType) {
      coupons = coupons.filter(
        (coupon) =>
          coupon.audience === "all" || coupon.audience === options.buyerType,
      );
    }
    return coupons;
  }

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return [];

  let query = supabase
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  if (options?.showInOffersOnly) query = query.eq("show_in_offers", true);
  if (options?.buyerType) {
    query = query.in("audience", ["all", options.buyerType]);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as Coupon[];
}

export async function getOffersForNavigation(
  buyerType: BuyerType,
  limit = 4,
): Promise<OfferCard[]> {
  const [coupons, combos] = await Promise.all([
    getPublicCoupons({ showInOffersOnly: true, buyerType }),
    getPublicCombos({ showInOffersOnly: true, buyerType, limit: 2 }),
  ]);

  const couponCards: OfferCard[] = coupons.map((coupon) => ({
    id: coupon.id,
    kind: "coupon",
    title: coupon.label ?? `${coupon.code} offer`,
    description: coupon.description ?? "Use this code at checkout.",
    code: coupon.code,
    href: `/offers#coupon-${coupon.code.toLowerCase()}`,
    meta:
      coupon.discount_type === "percentage"
        ? `${coupon.discount_value}% off`
        : "Special price",
  }));

  const comboCards: OfferCard[] = combos.map((combo) => ({
    id: combo.id,
    kind: "combo",
    title: combo.title,
    description: combo.description ?? "A considered set, priced together.",
    href: `/offers#combo-${combo.slug}`,
    meta: "Combo offer",
  }));

  return [...couponCards, ...comboCards].slice(0, limit);
}
