import "server-only";

import { unstable_cache } from "next/cache";
import type { ProductReview } from "@/lib/types";
import { demoProductReviews, demoProducts } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";

function clampLimit(limit: number, fallback: number) {
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(Math.trunc(limit), 1), 24);
}

function newestFirst(reviews: ProductReview[]) {
  return [...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function withDemoProduct(review: ProductReview): ProductReview {
  const product = demoProducts.find((item) => item.id === review.product_id);
  return {
    ...review,
    product: product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images,
        }
      : null,
  };
}

const loadProductReviews = unstable_cache(
  async (productId: string, limit: number): Promise<ProductReview[]> => {
    if (!isSupabaseConfigured) {
      return newestFirst(demoProductReviews.filter((review) => review.product_id === productId))
        .slice(0, limit);
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as ProductReview[];
  },
  ["product-reviews"],
  { tags: ["reviews"], revalidate: 300 },
);

export async function getProductReviews(productId: string, limit = 12) {
  return loadProductReviews(productId, clampLimit(limit, 12));
}

const loadHomepageReviews = unstable_cache(
  async (limit: number): Promise<ProductReview[]> => {
    if (!isSupabaseConfigured) {
      return newestFirst(demoProductReviews)
        .slice(0, limit)
        .map(withDemoProduct);
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*, product:products(id,name,slug,images)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as ProductReview[];
  },
  ["homepage-reviews"],
  { tags: ["reviews"], revalidate: 300 },
);

export async function getHomepageReviews(limit = 6) {
  return loadHomepageReviews(clampLimit(limit, 6));
}

export async function getOrderReviews(orderId: string): Promise<ProductReview[]> {
  if (!isSupabaseConfigured) {
    return newestFirst(demoProductReviews.filter((review) => review.order_id === orderId));
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];

  const { data, error } = await admin
    .from("product_reviews")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ProductReview[];
}
