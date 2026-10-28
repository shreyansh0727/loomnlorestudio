import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminCategories, getAdminProducts } from "@/lib/data/admin";
import { getAdminDraft } from "@/lib/data/admin-drafts";
import { AdminPageHeader } from "@/components/admin/ui";
import { SectionEditor, NewSectionTypePicker } from "@/components/admin/content-forms";
import { FormMessage } from "@/components/ui/form";
import { draftString } from "@/lib/drafts";
import { HOMEPAGE_SECTION_TYPES, type HomepageSectionType } from "@/lib/types";
import { HOMEPAGE_SECTION_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Add homepage section" };

function asSectionType(value: string | undefined): HomepageSectionType | null {
  return (HOMEPAGE_SECTION_TYPES as readonly string[]).includes(value ?? "")
    ? (value as HomepageSectionType)
    : null;
}

export default async function NewSectionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; draft?: string }>;
}) {
  const params = await searchParams;
  const draftId = (params.draft ?? "").trim();
  const draft = draftId ? await getAdminDraft(draftId, "section") : null;
  const type = asSectionType(params.type) ?? asSectionType(draftString(draft?.payload, "sectionType"));

  const [categories, products] = type
    ? await Promise.all([getAdminCategories(), getAdminProducts()])
    : [[], []];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title={
          type
            ? draft
              ? `Continue ${HOMEPAGE_SECTION_LABELS[type].toLowerCase()} draft`
              : `Add ${HOMEPAGE_SECTION_LABELS[type].toLowerCase()}`
            : "Add a section"
        }
        description={
          type
            ? draft
              ? "Your unfinished section is back in place. It only appears on the homepage once you add it."
              : "Compose the section, then place it in the homepage order. Unfinished work is kept as a draft."
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

      {draftId && !draft ? (
        <div className="mt-6">
          <FormMessage
            tone="info"
            message="That draft is no longer available. Starting a new section instead."
          />
        </div>
      ) : null}

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
          draft={draft ? { id: draft.id, payload: draft.payload } : null}
        />
      ) : (
        <NewSectionTypePicker />
      )}
    </div>
  );
}
