import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminCategories } from "@/lib/data/admin";
import { getAdminDraft } from "@/lib/data/admin-drafts";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/catalog-forms";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const draftId = (params.draft ?? "").trim();
  const [categories, draft] = await Promise.all([
    getAdminCategories(),
    draftId ? getAdminDraft(draftId, "product") : Promise.resolve(null),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title={draft ? "Continue product draft" : "New product"}
        description={
          draft
            ? "Your unfinished work is back in place. Nothing goes live until you create the product."
            : "Add the piece, its variants and pricing. Unfinished work is kept as a draft."
        }
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
      {draftId && !draft ? (
        <div className="mt-6">
          <FormMessage
            tone="info"
            message="That draft is no longer available. Starting a new product instead."
          />
        </div>
      ) : null}
      <ProductEditor
        categories={categories.filter((category) => category.is_active)}
        draft={draft ? { id: draft.id, payload: draft.payload } : null}
      />
    </div>
  );
}
