import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAdminCategories, getAdminProduct } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/catalog-forms";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title={product.name}
        description={`${product.category?.name ?? "Uncategorised"} · ${product.variants.length} variant${
          product.variants.length === 1 ? "" : "s"
        } · ${product.is_active ? "live on the storefront" : "hidden from the storefront"}`}
        actions={
          <>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Products
            </Link>
            <a
              href={`/shop/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              View live
            </a>
          </>
        }
      />

      {search.saved ? (
        <div className="mt-6">
          <FormMessage
            tone="success"
            message={
              search.saved === "created"
                ? "Product created. Review the details and publish it when you're ready."
                : "Product saved. The storefront has been refreshed."
            }
          />
        </div>
      ) : null}

      <ProductEditor product={product} categories={categories} />
    </div>
  );
}
