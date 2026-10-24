import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminCategories, getAdminProducts } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { SectionEditor, NewSectionTypePicker } from "@/components/admin/content-forms";
import { HOMEPAGE_SECTION_TYPES, type HomepageSectionType } from "@/lib/types";
import { HOMEPAGE_SECTION_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Add homepage section" };

export default async function NewSectionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const requested = params.type;
  const type = (HOMEPAGE_SECTION_TYPES as readonly string[]).includes(requested ?? "")
    ? (requested as HomepageSectionType)
    : null;

  const [categories, products] = type
    ? await Promise.all([getAdminCategories(), getAdminProducts()])
    : [[], []];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title={type ? `Add ${HOMEPAGE_SECTION_LABELS[type].toLowerCase()}` : "Add a section"}
        description={
          type
            ? "Compose the section, then place it in the homepage order."
            : "Choose the kind of section you want to add to the homepage."
        }
        actions={
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Homepage
          </Link>
        }
      />

      {type ? (
        <SectionEditor
          sectionType={type}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            category_id: product.category_id,
          }))}
        />
      ) : (
        <NewSectionTypePicker />
      )}
    </div>
  );
}
