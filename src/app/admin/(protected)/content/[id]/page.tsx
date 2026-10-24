import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  getAdminCategories,
  getAdminHomepageSection,
  getAdminProducts,
} from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { SectionEditor } from "@/components/admin/content-forms";
import { HOMEPAGE_SECTION_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Edit homepage section" };

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const section = await getAdminHomepageSection(id);
  if (!section) notFound();

  const [categories, products] = await Promise.all([
    getAdminCategories(),
    getAdminProducts(),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title={section.title || HOMEPAGE_SECTION_LABELS[section.section_type]}
        description={`${HOMEPAGE_SECTION_LABELS[section.section_type]} · ${
          section.is_active ? "shown on the homepage" : "hidden"
        }`}
        actions={
          <>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Homepage
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              View live
            </Link>
          </>
        }
      />

      <SectionEditor
        section={section}
        sectionType={section.section_type}
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
    </div>
  );
}
