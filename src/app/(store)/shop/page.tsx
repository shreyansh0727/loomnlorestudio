import Link from "next/link";
import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { getViewer } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { SortSelect } from "@/components/store/sort-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop the collection",
  description:
    "Handmade scrunchies, hair bows, fashion ties, headbands and crochet accessories from Buniya, Varanasi.",
};

interface ShopSearchParams {
  category?: string | string[];
  search?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const SORT_VALUES = new Set(["newest", "price-asc", "price-desc", "featured"]);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const categorySlug = first(params.category) ?? "";
  const search = (first(params.search) ?? "").trim();
  const sortParam = first(params.sort) ?? "featured";
  const sort = (SORT_VALUES.has(sortParam) ? sortParam : "featured") as
    | "newest"
    | "price-asc"
    | "price-desc"
    | "featured";
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);

  const [categories, viewer] = await Promise.all([getCategories(), getViewer()]);
  const activeCategory = categories.find((category) => category.slug === categorySlug);

  const { products, total } = await getProducts({
    categorySlug: activeCategory?.slug,
    search,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefWith(overrides: Record<string, string | null>) {
    const next = new URLSearchParams();
    if (activeCategory?.slug) next.set("category", activeCategory.slug);
    if (search) next.set("search", search);
    if (sort !== "featured") next.set("sort", sort);
    if (page > 1) next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `/shop?${query}` : "/shop";
  }

  return (
    <>
      <section className="paper-edge relative border-b border-line bg-cream/60">
        <div className="editorial-container py-10 lg:py-14">
          <Breadcrumbs
            items={
              activeCategory ? [{ label: "Shop", href: "/shop" }, { label: activeCategory.name }] : [{ label: "Shop" }]
            }
          />
          <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow text-clay">
                {search ? "Search results" : activeCategory ? "By collection" : "The collection"}
              </p>
              <h1 className="display-title mt-3 text-[clamp(2.6rem,5.5vw,4.6rem)]">
                {search ? `“${search}”` : activeCategory?.name ?? "Little things, made lovely."}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                {activeCategory?.description ??
                  "Scrunchies, bows, ties and crochet keepsakes, handmade in Varanasi. Every price includes GST; retail shipping is a fixed ₹60–₹80 by delivery zone."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {viewer.isB2B ? (
                <Badge tone="sage">Trade prices active</Badge>
              ) : (
                <Link
                  href="/business"
                  className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-clay underline-offset-4 hover:underline"
                >
                  Buying for a business? Apply for trade pricing
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-container py-8 lg:py-10">
        <div className="flex flex-col gap-5 border-b border-line pb-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <CategoryChip href={hrefWith({ category: null, page: null })} active={!activeCategory}>
              All pieces
            </CategoryChip>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                href={hrefWith({ category: category.slug, page: null })}
                active={activeCategory?.id === category.id}
              >
                {category.name}
              </CategoryChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <form action="/shop" method="get" className="relative flex-1 sm:max-w-xs">
              {activeCategory ? (
                <input type="hidden" name="category" value={activeCategory.slug} />
              ) : null}
              {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                strokeWidth={1.6}
              />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Scrunchies, bows, pearls…"
                aria-label="Search products"
                className="field-base h-10 w-full pl-9 pr-3 text-sm"
              />
            </form>

            <div className="flex items-center gap-4">
              <p className="hidden text-[0.64rem] uppercase tracking-[0.14em] text-muted sm:block">
                {formatNumber(total)} little {total === 1 ? "piece" : "pieces"}
              </p>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-muted" strokeWidth={1.6} />
                <SortSelect value={sort} />
              </div>
            </div>
          </div>

          {!viewer.isB2B ? (
            <p className="text-[0.62rem] uppercase tracking-[0.13em] text-muted">
              Retail orders · up to 10 units per product · GST-inclusive prices
            </p>
          ) : (
            <p className="text-[0.62rem] uppercase tracking-[0.13em] text-sage">
              Wholesale pricing shown · per-product minimums apply · GST invoice issued
            </p>
          )}
        </div>

        {products.length ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:mt-10 lg:gap-x-6 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isB2B={viewer.isB2B}
                  imageSizes="(min-width: 1280px) 23vw, (min-width: 768px) 30vw, 50vw"
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-14 flex items-center justify-between border-t border-line pt-6"
              >
                {page > 1 ? (
                  <Link
                    href={hrefWith({ page: String(page - 1) })}
                    className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="text-[0.64rem] uppercase tracking-[0.15em] text-muted/50">
                    ← Previous
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (pageNumber) =>
                        totalPages <= 7 ||
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        Math.abs(pageNumber - page) <= 1,
                    )
                    .map((pageNumber, index, list) => (
                      <span key={pageNumber} className="flex items-center gap-1.5">
                        {index > 0 && pageNumber - list[index - 1] > 1 ? (
                          <span className="px-1 text-xs text-muted">…</span>
                        ) : null}
                        <Link
                          href={hrefWith({ page: pageNumber === 1 ? null : String(pageNumber) })}
                          aria-current={pageNumber === page ? "page" : undefined}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-full text-xs transition-colors",
                            pageNumber === page
                              ? "bg-clay text-cream"
                              : "text-ink-soft hover:bg-clay/10 hover:text-ink",
                          )}
                        >
                          {pageNumber}
                        </Link>
                      </span>
                    ))}
                </div>

                {page < totalPages ? (
                  <Link
                    href={hrefWith({ page: String(page + 1) })}
                    className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="text-[0.64rem] uppercase tracking-[0.15em] text-muted/50">
                    Next →
                  </span>
                )}
              </nav>
            ) : null}
          </>
        ) : (
          <EmptyState
            className="mt-10"
            icon={<Search className="size-6" strokeWidth={1.4} />}
            title="No little things match this search"
            description={
              search
                ? `We could not find anything for “${search}”. Try a colour, a style or a broader term.`
                : "This collection is still being prepared. Explore all our handmade pieces in the meantime."
            }
            action={
              <Link href="/shop" className={buttonStyles({ variant: "secondary", size: "md" })}>
                View all pieces
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.13em] transition-colors",
        active
          ? "border-clay bg-clay text-cream"
          : "border-line bg-transparent text-ink-soft hover:border-clay/50 hover:text-clay",
      )}
    >
      {children}
    </Link>
  );
}
