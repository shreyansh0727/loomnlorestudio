import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDraft } from "@/lib/data/admin-drafts";
import { AdminPageHeader } from "@/components/admin/ui";
import { PopupForm } from "@/components/admin/content-forms";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "New popup" };

export default async function NewPopupPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const draftId = (params.draft ?? "").trim();
  const draft = draftId ? await getAdminDraft(draftId, "popup") : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title={draft ? "Continue popup draft" : "New popup"}
        description={
          draft
            ? "Your unfinished popup is back in place. It only appears once you create it."
            : "A welcome offer, a shipping note or a quiet announcement. Unfinished work is kept as a draft."
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
            message="That draft is no longer available. Starting a new popup instead."
          />
        </div>
      ) : null}
      <PopupForm draft={draft ? { id: draft.id, payload: draft.payload } : null} />
    </div>
  );
}
