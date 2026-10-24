import "server-only";

import type {
  Business,
  Category,
  Combo,
  ComboItem,
  Coupon,
  EmailLog,
  HomepageSection,
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PopupOffer,
  Product,
  ProductVariant,
} from "@/lib/types";
import {
  demoCategories,
  demoCombos,
  demoCoupons,
  demoHomepageSections,
  demoPopupOffer,
  demoProducts,
} from "@/lib/demo-data";
import {
  demoBusinesses,
  demoEmailLogs,
  demoOrderEvents,
  demoOrderItems,
  demoOrders,
} from "@/lib/demo-transactions";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";

const LOW_STOCK_THRESHOLD = 5;
const PAGE_SIZE = 20;

function withCategory(product: Product, categories: Category[]): Product {
  return {
    ...product,
    images: Array.isArray(product.images) ? product.images : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    variants: [...(product.variants ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    category: categories.find((category) => category.id === product.category_id) ?? null,
  };
}

function normaliseAdminProduct(row: Record<string, unknown>): Product {
  const product = row as unknown as Product;
  return {
    ...product,
    images: Array.isArray(product.images) ? product.images : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    category: (row.category as Category | null | undefined) ?? null,
    variants: Array.isArray(product.variants)
      ? [...product.variants].sort((a, b) => a.sort_order - b.sort_order)
      : [],
  };
}

function searchable(value: string | null | undefined, search: string) {
  return (value ?? "").toLowerCase().includes(search);
}

function normaliseSearch(value: string) {
  return value.replace(/[,()%]/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface AdminOrderListOptions {
  status?: OrderStatus | "all";
  search?: string;
  page?: number;
}

export async function getAdminOrders(options: AdminOrderListOptions = {}) {
  if (!isSupabaseConfigured) {
    const search = (options.search ?? "").trim().toLowerCase();
    const filtered = demoOrders
      .filter(
        (order) =>
          (!options.status ||
            options.status === "all" ||
            order.status === options.status) &&
          (!search ||
            searchable(order.order_number, search) ||
            searchable(order.customer_name, search) ||
            searchable(order.email, search) ||
            searchable(order.phone, search)),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const page = Math.max(1, options.page ?? 1);
    const start = (page - 1) * PAGE_SIZE;
    return {
      orders: filtered.slice(start, start + PAGE_SIZE),
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
    };
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return { orders: [] as Order[], total: 0, page: 1, pageSize: PAGE_SIZE };

  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const search = normaliseSearch(options.search ?? "");

  let query = admin
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,customer_name.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`Unable to load orders: ${error.message}`);

  return {
    orders: (data ?? []) as unknown as Order[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export interface AdminOrderDetail {
  order: Order;
  items: OrderItem[];
  events: OrderEvent[];
  emails: EmailLog[];
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  if (!isSupabaseConfigured) {
    const order = demoOrders.find((candidate) => candidate.id === id);
    if (!order) return null;
    return {
      order,
      items: demoOrderItems.filter((item) => item.order_id === id),
      events: demoOrderEvents
        .filter((event) => event.order_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      emails: demoEmailLogs
        .filter((email) => email.order_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data: orderRow, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !orderRow) return null;

  const [items, events, emails] = await Promise.all([
    admin
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("order_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("email_logs")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    order: orderRow as unknown as Order,
    items: (items.data ?? []) as unknown as OrderItem[],
    events: (events.data ?? []) as unknown as OrderEvent[],
    emails: (emails.data ?? []) as unknown as EmailLog[],
  };
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function getAdminCategories(): Promise<
  (Category & { product_count: number })[]
> {
  if (!isSupabaseConfigured) {
    return demoCategories.map((category) => ({
      ...category,
      product_count: demoProducts.filter(
        (product) => product.category_id === category.id,
      ).length,
    }));
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];

  const [{ data: categories, error }, { data: products }] = await Promise.all([
    admin.from("categories").select("*").order("sort_order", { ascending: true }),
    admin.from("products").select("category_id"),
  ]);
  if (error) throw new Error(`Unable to load categories: ${error.message}`);

  const counts = (products ?? []).reduce<Record<string, number>>((acc, row) => {
    const categoryId = row.category_id as string;
    acc[categoryId] = (acc[categoryId] ?? 0) + 1;
    return acc;
  }, {});

  return ((categories ?? []) as Category[]).map((category) => ({
    ...category,
    product_count: counts[category.id] ?? 0,
  }));
}

export async function getAdminCategory(id: string): Promise<Category | null> {
  if (!isSupabaseConfigured) {
    return demoCategories.find((category) => category.id === id) ?? null;
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;
  const { data } = await admin.from("categories").select("*").eq("id", id).maybeSingle();
  return (data as Category | null) ?? null;
}

export interface AdminProductFilters {
  search?: string;
  categoryId?: string;
  status?: "all" | "active" | "inactive";
}

export async function getAdminProducts(filters: AdminProductFilters = {}) {
  let products: Product[];
  if (!isSupabaseConfigured) {
    products = demoProducts.map((product) => withCategory(product, demoCategories));
  } else {
    const admin = getSupabaseAdminClientSafe();
    if (!admin) return [];
    const { data, error } = await admin
      .from("products")
      .select(
        "*, category:categories(id,name,slug,description,image_url,sort_order,is_active,created_at,updated_at), variants:product_variants(*)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Unable to load products: ${error.message}`);
    products = (data ?? []).map((row) =>
      normaliseAdminProduct(row as Record<string, unknown>),
    );
  }

  const search = (filters.search ?? "").trim().toLowerCase();
  return products
    .filter((product) => {
      if (filters.categoryId && product.category_id !== filters.categoryId) return false;
      if (filters.status === "active" && !product.is_active) return false;
      if (filters.status === "inactive" && product.is_active) return false;
      if (!search) return true;
      return (
        searchable(product.name, search) ||
        searchable(product.slug, search) ||
        product.variants.some((variant) => searchable(variant.sku, search))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    const product = demoProducts.find((item) => item.id === id);
    return product ? withCategory(product, demoCategories) : null;
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;
  const { data, error } = await admin
    .from("products")
    .select(
      "*, category:categories(id,name,slug,description,image_url,sort_order,is_active,created_at,updated_at), variants:product_variants(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normaliseAdminProduct(data as Record<string, unknown>);
}

export interface AdminVariantOption {
  variant_id: string;
  product_id: string;
  product_name: string;
  label: string;
  sku: string | null;
  stock_qty: number;
  retail_price: number;
  wholesale_price: number | null;
  is_active: boolean;
}

export async function getAdminVariantOptions(): Promise<AdminVariantOption[]> {
  let products: Product[];
  if (!isSupabaseConfigured) {
    products = demoProducts;
  } else {
    const admin = getSupabaseAdminClientSafe();
    if (!admin) return [];
    const { data, error } = await admin
      .from("products")
      .select("id,name,retail_price,wholesale_price,variants:product_variants(*)")
      .order("name", { ascending: true });
    if (error) throw new Error(`Unable to load variants: ${error.message}`);
    products = (data ?? []) as unknown as Product[];
  }

  return products.flatMap((product) =>
    (product.variants ?? []).map((variant: ProductVariant) => ({
      variant_id: variant.id,
      product_id: product.id,
      product_name: product.name,
      label: variant.label,
      sku: variant.sku,
      stock_qty: variant.stock_qty,
      retail_price: variant.retail_price_override ?? product.retail_price,
      wholesale_price:
        variant.wholesale_price_override ?? product.wholesale_price ?? null,
      is_active: variant.is_active,
    })),
  );
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export async function getAdminCoupons(): Promise<
  (Coupon & { redemption_count: number })[]
> {
  if (!isSupabaseConfigured) {
    return demoCoupons.map((coupon) => ({ ...coupon, redemption_count: 0 }));
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];

  const [{ data: coupons, error }, { data: redemptions }] = await Promise.all([
    admin.from("coupons").select("*").order("created_at", { ascending: false }),
    admin.from("coupon_redemptions").select("coupon_id"),
  ]);
  if (error) throw new Error(`Unable to load coupons: ${error.message}`);

  const counts = (redemptions ?? []).reduce<Record<string, number>>((acc, row) => {
    const couponId = row.coupon_id as string;
    acc[couponId] = (acc[couponId] ?? 0) + 1;
    return acc;
  }, {});

  return ((coupons ?? []) as Coupon[]).map((coupon) => ({
    ...coupon,
    redemption_count: counts[coupon.id] ?? 0,
  }));
}

export async function getAdminCoupon(id: string): Promise<Coupon | null> {
  if (!isSupabaseConfigured) {
    return demoCoupons.find((coupon) => coupon.id === id) ?? null;
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;
  const { data } = await admin.from("coupons").select("*").eq("id", id).maybeSingle();
  return (data as Coupon | null) ?? null;
}

type AdminComboItemRow = Omit<ComboItem, "product" | "variant"> & {
  variant?: {
    id: string;
    label: string;
    sku: string | null;
    stock_qty: number;
    product?: ComboItem["product"];
  } | null;
};

function hydrateAdminCombo(
  row: Omit<Combo, "items"> & { items?: AdminComboItemRow[] },
): Combo {
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
  return {
    ...(row as Combo),
    items,
    retail_value: items.reduce(
      (total, item) => total + (item.product?.retail_price ?? 0) * item.quantity,
      0,
    ),
  };
}

export async function getAdminCombos(): Promise<Combo[]> {
  if (!isSupabaseConfigured) return demoCombos;
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];

  const { data, error } = await admin
    .from("combos")
    .select(
      "*, items:combo_items(*, variant:product_variants(id,label,sku,stock_qty,product:products(id,name,slug,images,retail_price)))",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load combos: ${error.message}`);

  return ((data ?? []) as unknown as Parameters<typeof hydrateAdminCombo>[0][]).map(
    hydrateAdminCombo,
  );
}

export async function getAdminCombo(id: string): Promise<Combo | null> {
  if (!isSupabaseConfigured) {
    return demoCombos.find((combo) => combo.id === id) ?? null;
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;
  const { data, error } = await admin
    .from("combos")
    .select(
      "*, items:combo_items(*, variant:product_variants(id,label,sku,stock_qty,product:products(id,name,slug,images,retail_price)))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return hydrateAdminCombo(data as unknown as Parameters<typeof hydrateAdminCombo>[0]);
}

// ---------------------------------------------------------------------------
// Storefront content
// ---------------------------------------------------------------------------

export async function getAdminHomepageSections(): Promise<HomepageSection[]> {
  if (!isSupabaseConfigured) return demoHomepageSections;
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];
  const { data, error } = await admin
    .from("homepage_sections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Unable to load homepage content: ${error.message}`);
  return (data ?? []) as unknown as HomepageSection[];
}

export async function getAdminHomepageSection(
  id: string,
): Promise<HomepageSection | null> {
  if (!isSupabaseConfigured) {
    return demoHomepageSections.find((section) => section.id === id) ?? null;
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;
  const { data } = await admin
    .from("homepage_sections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as HomepageSection | null) ?? null;
}

export async function getAdminPopupOffers(): Promise<PopupOffer[]> {
  if (!isSupabaseConfigured) return [demoPopupOffer];
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];
  const { data, error } = await admin
    .from("popup_offers")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load popup offers: ${error.message}`);
  return (data ?? []) as PopupOffer[];
}

export async function getAdminPopupOffer(id: string): Promise<PopupOffer | null> {
  if (!isSupabaseConfigured) {
    return demoPopupOffer.id === id ? demoPopupOffer : null;
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;
  const { data } = await admin
    .from("popup_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PopupOffer | null) ?? null;
}

// ---------------------------------------------------------------------------
// Trade accounts
// ---------------------------------------------------------------------------

export async function getAdminBusinesses(
  status: "all" | Business["status"] = "all",
): Promise<Business[]> {
  if (!isSupabaseConfigured) {
    return status === "all"
      ? demoBusinesses
      : demoBusinesses.filter((business) => business.status === status);
  }
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];

  let query = admin.from("businesses").select("*");
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query.order("submitted_at", { ascending: false });
  if (error) throw new Error(`Unable to load trade applications: ${error.message}`);
  return (data ?? []) as Business[];
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface LowStockRow {
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_label: string;
  sku: string | null;
  stock_qty: number;
}

export interface AdminDashboard {
  revenue30d: number;
  orders30d: number;
  awaitingFulfilment: number;
  pendingBusinesses: number;
  activeProducts: number;
  lowStock: LowStockRow[];
  recentOrders: Order[];
  recentEmails: EmailLog[];
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  if (!isSupabaseConfigured) {
    const lowStock: LowStockRow[] = demoProducts.flatMap((product) =>
      product.variants
        .filter((variant) => variant.stock_qty <= LOW_STOCK_THRESHOLD)
        .map((variant) => ({
          variant_id: variant.id,
          product_id: product.id,
          product_name: product.name,
          variant_label: variant.label,
          sku: variant.sku,
          stock_qty: variant.stock_qty,
        })),
    );
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const paidInWindow = demoOrders.filter(
      (order) =>
        order.payment_status === "paid" &&
        order.paid_at &&
        order.paid_at >= thirtyDaysAgo,
    );
    return {
      revenue30d: paidInWindow.reduce((total, order) => total + order.amount_paid, 0),
      orders30d: demoOrders.filter((order) => order.created_at >= thirtyDaysAgo).length,
      awaitingFulfilment: demoOrders.filter((order) =>
        ["confirmed", "processing", "packed"].includes(order.status),
      ).length,
      pendingBusinesses: demoBusinesses.filter(
        (business) => business.status === "pending",
      ).length,
      activeProducts: demoProducts.filter((product) => product.is_active).length,
      lowStock,
      recentOrders: [...demoOrders]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 7),
      recentEmails: [...demoEmailLogs]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 6),
    };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    return {
      revenue30d: 0,
      orders30d: 0,
      awaitingFulfilment: 0,
      pendingBusinesses: 0,
      activeProducts: 0,
      lowStock: [],
      recentOrders: [],
      recentEmails: [],
    };
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [recentOrders, businessCount, activeProductCount, lowStockRows, emails] =
    await Promise.all([
      admin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("product_variants")
        .select(
          "id,label,sku,stock_qty,product_id,product:products(id,name,is_active)",
        )
        .eq("is_active", true)
        .lte("stock_qty", LOW_STOCK_THRESHOLD)
        .order("stock_qty", { ascending: true })
        .limit(8),
      admin
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const orders = (recentOrders.data ?? []) as unknown as Order[];
  const paidInWindow = orders.filter(
    (order) =>
      order.payment_status === "paid" &&
      order.paid_at &&
      order.paid_at >= thirtyDaysAgo,
  );

  const lowStock: LowStockRow[] = (lowStockRows.data ?? [])
    .map((row) => {
      const record = row as {
        id: string;
        label: string;
        sku: string | null;
        stock_qty: number;
        product_id: string;
        product?: { name?: string; is_active?: boolean } | null;
      };
      if (record.product && record.product.is_active === false) return null;
      return {
        variant_id: record.id,
        product_id: record.product_id,
        product_name: record.product?.name ?? "Unknown product",
        variant_label: record.label,
        sku: record.sku,
        stock_qty: record.stock_qty,
      };
    })
    .filter((row): row is LowStockRow => Boolean(row));

  return {
    revenue30d: paidInWindow.reduce((total, order) => total + order.amount_paid, 0),
    orders30d: orders.filter((order) => order.created_at >= thirtyDaysAgo).length,
    awaitingFulfilment: orders.filter((order) =>
      ["confirmed", "processing", "packed"].includes(order.status),
    ).length,
    pendingBusinesses: businessCount.count ?? 0,
    activeProducts: activeProductCount.count ?? 0,
    lowStock,
    recentOrders: orders.slice(0, 7),
    recentEmails: (emails.data ?? []) as unknown as EmailLog[],
  };
}
