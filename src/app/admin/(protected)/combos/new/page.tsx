import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminVariantOptions } from "@/lib/data/admin";
import { getAdminDraft } from "@/lib/data/admin-drafts";
import { AdminPageHeader } from "@/components/admin/ui";
import { ComboForm } from "@/components/admin/promotion-forms";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "New bundle" };

export default async function NewComboPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const draftId = (params.draft ?? "").trim();
  const [variants, draft] = await Promise.all([
    getAdminVariantOptions(),
    draftId ? getAdminDraft(draftId, "combo") : Promise.resolve(null),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title={draft ? "Continue bundle draft" : "New bundle"}
        description={
          draft
            ? "Your unfinished bundle is back in place. It is only live once you create it."
            : "Choose the pieces, set the bundle price and decide who can buy it. Unfinished work is kept as a draft."
        }
        actions={
          <Link
            href="/admin/combos"
            className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Combos
          </Link>
        }
      />
      {draftId && !draft ? (
        <div className="mt-6">
          <FormMessage
            tone="info"
            message="That draft is no longer available. Starting a new bundle instead."
          />
        </div>
      ) : null}
      <ComboForm
        variants={variants}
        draft={draft ? { id: draft.id, payload: draft.payload } : null}
      />
    </div>
  );
}
