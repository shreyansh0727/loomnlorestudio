import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Package, Plus, Search } from "lucide-react";
import { getAdminCategories, getAdminProducts } from "@/lib/data/admin";
import { toggleProductActiveAction } from "@/lib/actions/admin/catalog";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { formatMoney, getTotalStock } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 80);
  const categoryId =
    params.category && params.category !== "all" ? params.category : undefined;
  const status =
    params.status === "active" || params.status === "inactive"
      ? params.status
      : "all";

  const [categories, products] = await Promise.all([
    getAdminCategories(),
    getAdminProducts({ search, categoryId, status }),
  ]);
  const hasFilters = Boolean(search) || Boolean(categoryId) || status !== "all";

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Fabrics by the metre, home textiles and ready-made pieces. Manage pricing, variants and stock."
        actions={
          <>
            <Link
              href="/admin/categories"
              className="border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              Categories
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
            >
              <Plus className="size-3.5" aria-hidden />
              New product
            </Link>
          </>
        }
      />

      <div className="mt-6">
        <Panel bodyClassName="px-5 py-4">
          <form method="get" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_11rem_auto] lg:items-end">
            <div>
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={search}
                placeholder="Product name, slug or SKU"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={categoryId ?? "all"}>
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Visibility</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="all">All</option>
                <option value="active">Live</option>
                <option value="inactive">Hidden</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="md" className="h-11">
                <Search className="size-3.5" aria-hidden />
                Filter
              </Button>
              {hasFilters ? (
                <Link
                  href="/admin/products"
                  className="inline-flex h-11 items-center px-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel bodyClassName="pt-4">
          {products.length ? (
            <DataTable minWidth="min-w-[900px]">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th>Variants</Th>
                  <Th>Stock</Th>
                  <Th>Retail</Th>
                  <Th>Trade</Th>
                  <Th>Visibility</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = getTotalStock(product);
                  const activeVariants = product.variants.filter(
                    (variant) => variant.is_active,
                  ).length;
                  return (
                    <tr key={product.id} className="group">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="relative size-11 shrink-0 overflow-hidden border border-line bg-sand">
                            <SafeImage
                              src={product.images[0]}
                              alt={product.name}
                              sizes="44px"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="block max-w-[18rem] truncate font-medium transition-colors group-hover:text-clay-deep"
                            >
                              {product.name}
                            </Link>
                            <p className="max-w-[18rem] truncate text-[0.66rem] text-muted">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-[0.72rem] text-ink-soft">
                        {product.category?.name ?? "—"}
                      </Td>
                      <Td className="text-[0.72rem]">
                        {activeVariants}
                        {activeVariants !== product.variants.length ? (
                          <span className="text-muted"> / {product.variants.length}</span>
                        ) : null}
                      </Td>
                      <Td>
                        <span
                          className={
                            stock === 0
                              ? "text-[0.72rem] font-medium text-red-900"
                              : stock <= 5
                                ? "text-[0.72rem] font-medium text-clay-deep"
                                : "text-[0.72rem]"
                          }
                        >
                          {stock} units
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-[0.72rem]">
                        {formatMoney(product.retail_price)}
                        <span className="text-muted"> / {product.unit}</span>
                      </Td>
                      <Td className="whitespace-nowrap text-[0.72rem] text-muted">
                        {product.wholesale_price
                          ? `${formatMoney(product.wholesale_price)} · MOQ ${product.moq}`
                          : "Not offered"}
                      </Td>
                      <Td>
                        {product.is_active ? (
                          <Pill tone="positive">Live</Pill>
                        ) : (
                          <Pill>Hidden</Pill>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                          >
                            Edit
                          </Link>
                          <ActionButton
                            action={toggleProductActiveAction}
                            fields={{ id: product.id, nextActive: !product.is_active }}
                            variant="ghost"
                            size="sm"
                            className="border border-line px-2.5 py-1.5 text-[0.56rem]"
                            pendingLabel="Saving"
                          >
                            {product.is_active ? (
                              <>
                                <EyeOff className="size-3.5" aria-hidden />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="size-3.5" aria-hidden />
                                Publish
                              </>
                            )}
                          </ActionButton>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Package className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-2xl font-light tracking-[-0.02em]">
                {hasFilters ? "No products match" : "The catalog is empty"}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                {hasFilters
                  ? "Adjust the filters or clear the search to see every piece."
                  : "Add your first piece to start selling fabrics, home textiles and ready-made goods."}
              </p>
              <div className="mt-6 flex gap-2">
                {hasFilters ? (
                  <Link
                    href="/admin/products"
                    className="border border-line px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-ink"
                  >
                    Clear filters
                  </Link>
                ) : (
                  <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    New product
                  </Link>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
