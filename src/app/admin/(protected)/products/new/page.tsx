import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminCategories } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/catalog-forms";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title="New product"
        description="Add the piece, its variants and pricing. It stays hidden until you mark it visible."
        actions={
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Products
          </Link>
        }
      />
      <ProductEditor categories={categories.filter((category) => category.is_active)} />
    </div>
  );
}
