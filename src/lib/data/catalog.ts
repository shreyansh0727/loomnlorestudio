import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Product, ProductVariant, Category, ProductRailSource } from "@/lib/types";
import { demoCategories, demoProducts } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { PAGE_SIZE } from "@/lib/constants";

export interface ProductFilters {
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "featured";
  newArrivals?: boolean;
  featured?: boolean;
  bestSellers?: boolean;
  limit?: number;
  offset?: number;
}

function normaliseProduct(row: Record<string, unknown>): Product {
  const variants = Array.isArray(row.variants)
    ? (row.variants as ProductVariant[]).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const category = row.category as Category | null | undefined;

  return {
    ...(row as unknown as Product),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    category: category ?? null,
    variants,
  };
}

function demoFilteredProducts(filters: ProductFilters) {
  let rows = demoProducts
    .filter((product) => product.is_active)
    .map((product) => ({
      ...product,
      category: demoCategories.find((item) => item.id === product.category_id) ?? null,
    }));

  if (filters.categorySlug) {
    rows = rows.filter((product) => product.category?.slug === filters.categorySlug);
  }
  if (filters.categoryId) {
    rows = rows.filter((product) => product.category_id === filters.categoryId);
  }
  if (filters.newArrivals) rows = rows.filter((product) => product.is_new_arrival);
  if (filters.featured) rows = rows.filter((product) => product.is_featured);
  if (filters.bestSellers) rows = rows.filter((product) => product.is_best_seller);
  if (filters.search) {
    const search = filters.search.toLowerCase();
    rows = rows.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        (product.short_description ?? "").toLowerCase().includes(search) ||
        product.tags.some((tag) => tag.toLowerCase().includes(search)),
    );
  }

  const sort = filters.sort ?? "featured";
  if (sort === "price-asc") rows.sort((a, b) => a.retail_price - b.retail_price);
  else if (sort === "price-desc") rows.sort((a, b) => b.retail_price - a.retail_price);
  else if (sort === "newest") {
    rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    rows.sort(
      (a, b) =>
        Number(b.is_featured) - Number(a.is_featured) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? PAGE_SIZE;
  return {
    products: rows.slice(offset, offset + limit),
    total: rows.length,
  };
}

const CATALOG_CACHE_SECONDS = 300;

function normaliseFilters(filters: ProductFilters): ProductFilters {
  return {
    categorySlug: filters.categorySlug || undefined,
    categoryId: filters.categoryId || undefined,
    newArrivals: Boolean(filters.newArrivals),
    featured: Boolean(filters.featured),
    bestSellers: Boolean(filters.bestSellers),
    limit: filters.limit ?? PAGE_SIZE,
    offset: filters.offset ?? 0,
    sort: filters.sort ?? "featured",
  };
}

async function queryProducts(filters: ProductFilters) {
  if (!isSupabaseConfigured) return demoFilteredProducts(filters);

  const supabase = getPublicSupabaseClient();
  if (!supabase) return demoFilteredProducts(filters);

  const categoryId =
    filters.categoryId ??
    (filters.categorySlug
      ? (
          await supabase
            .from("categories")
            .select("id")
            .eq("slug", filters.categorySlug)
            .eq("is_active", true)
            .maybeSingle()
        ).data?.id
      : null);

  if (filters.categorySlug && !categoryId) {
    return { products: [] as Product[], total: 0 };
  }

  let query = supabase
    .from("products")
    .select(
      "*, category:categories(id,name,slug,description,image_url,sort_order,is_active,created_at,updated_at), variants:product_variants(*)",
      { count: "exact" },
    )
    .eq("is_active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (filters.newArrivals) query = query.eq("is_new_arrival", true);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.bestSellers) query = query.eq("is_best_seller", true);
  if (filters.search) {
    const search = filters.search.replace(/[,()%]/g, " ").trim();
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,short_description.ilike.%${search}%`,
      );
    }
  }

  const sort = filters.sort ?? "featured";
  if (sort === "price-asc") query = query.order("retail_price", { ascending: true });
  else if (sort === "price-desc")
    query = query.order("retail_price", { ascending: false });
  else if (sort === "newest") query = query.order("created_at", { ascending: false });
  else
    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

  const limit = filters.limit ?? PAGE_SIZE;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Unable to load products: ${error.message}`);

  return {
    products: (data ?? []).map((row) => normaliseProduct(row as Record<string, unknown>)),
    total: count ?? 0,
  };
}

const loadProducts = unstable_cache(
  (filters: ProductFilters) => queryProducts(filters),
  ["products"],
  { tags: ["products"], revalidate: CATALOG_CACHE_SECONDS },
);

export async function getProducts(filters: ProductFilters = {}) {
  // Search terms are unbounded, so they bypass the shared cache.
  if (filters.search) return queryProducts(filters);
  return loadProducts(normaliseFilters(filters));
}

const loadProductBySlug = unstable_cache(
  async function loadProductBySlug(slug: string): Promise<Product | null> {
    if (!isSupabaseConfigured) {
      const product = demoProducts.find(
        (item) => item.slug === slug && item.is_active,
      );
      if (!product) return null;
      return {
        ...product,
        category: demoCategories.find((item) => item.id === product.category_id) ?? null,
      };
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("products")
      .select(
        "*, category:categories(id,name,slug,description,image_url,sort_order,is_active,created_at,updated_at), variants:product_variants(*)",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(`Unable to load product: ${error.message}`);
    if (!data) return null;
    return normaliseProduct(data as Record<string, unknown>);
  },
  ["product-by-slug"],
  { tags: ["products"], revalidate: CATALOG_CACHE_SECONDS },
);

export const getProductBySlug = cache(loadProductBySlug);

async function queryRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit: number,
) {
  if (!isSupabaseConfigured) {
    return demoProducts
      .filter(
        (product) =>
          product.is_active &&
          product.category_id === categoryId &&
          product.id !== excludeProductId,
      )
      .slice(0, limit)
      .map((product) => ({
        ...product,
        category: demoCategories.find((item) => item.id === product.category_id) ?? null,
      }));
  }

  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id,name,slug,description,image_url,sort_order,is_active,created_at,updated_at), variants:product_variants(*)",
    )
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", excludeProductId)
    .order("is_featured", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Unable to load related products: ${error.message}`);
  return (data ?? []).map((row) => normaliseProduct(row as Record<string, unknown>));
}

const loadRelatedProducts = unstable_cache(
  queryRelatedProducts,
  ["related-products"],
  { tags: ["products"], revalidate: CATALOG_CACHE_SECONDS },
);

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
) {
  return loadRelatedProducts(categoryId, excludeProductId, limit);
}

async function queryProductsByIds(ids: string[]) {
  if (!isSupabaseConfigured) {
    return ids
      .map((id) =>
        demoProducts.find((product) => product.id === id && product.is_active),
      )
      .filter((product): product is Product => Boolean(product))
      .map((product) => ({
        ...product,
        category: demoCategories.find((item) => item.id === product.category_id) ?? null,
      }));
  }

  const supabase = getPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id,name,slug,description,image_url,sort_order,is_active,created_at,updated_at), variants:product_variants(*)",
    )
    .in("id", ids)
    .eq("is_active", true);

  if (error) throw new Error(`Unable to load products: ${error.message}`);

  const byId = new Map(
    (data ?? []).map((row) => {
      const product = normaliseProduct(row as Record<string, unknown>);
      return [product.id, product] as const;
    }),
  );

  return ids.map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
}

const loadProductsByIds = unstable_cache(
  queryProductsByIds,
  ["products-by-ids"],
  { tags: ["products"], revalidate: CATALOG_CACHE_SECONDS },
);

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [] as Product[];
  const sortedIds = [...new Set(ids)].sort();
  const products = await loadProductsByIds(sortedIds);
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product));
}

export async function getRailProducts(
  config: ProductRailSource,
  fallbackLimit = 4,
): Promise<Product[]> {
  const limit = config.limit || fallbackLimit;

  if (config.source === "manual") {
    return getProductsByIds(config.product_ids.slice(0, limit));
  }

  if (config.source === "category" && config.category_id) {
    const result = await getProducts({
      categoryId: config.category_id,
      limit,
      sort: "newest",
    });
    return result.products;
  }

  const filters: ProductFilters = { limit, sort: "newest" };
  if (config.source === "new_arrivals") filters.newArrivals = true;
  if (config.source === "featured") filters.featured = true;
  if (config.source === "best_sellers") filters.bestSellers = true;

  const result = await getProducts(filters);
  return result.products;
}

const loadCategories = unstable_cache(
  async (): Promise<Category[]> => {
    if (!isSupabaseConfigured) return demoCategories.filter((item) => item.is_active);

    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(`Unable to load categories: ${error.message}`);
    return (data ?? []) as Category[];
  },
  ["categories"],
  { tags: ["categories"], revalidate: 300 },
);

export const getCategories = cache(loadCategories);

async function queryCategoryCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) {
    return demoProducts.reduce<Record<string, number>>((counts, product) => {
      if (product.is_active) {
        counts[product.category_id] = (counts[product.category_id] ?? 0) + 1;
      }
      return counts;
    }, {});
  }

  const supabase = getPublicSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_active", true);

  if (error) return {};

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    const categoryId = row.category_id as string;
    counts[categoryId] = (counts[categoryId] ?? 0) + 1;
    return counts;
  }, {});
}

const loadCategoryCounts = unstable_cache(
  queryCategoryCounts,
  ["category-counts"],
  { tags: ["products", "categories"], revalidate: CATALOG_CACHE_SECONDS },
);

export function getCategoryCounts() {
  return loadCategoryCounts();
}
