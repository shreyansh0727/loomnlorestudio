import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminDraft } from "@/lib/data/admin-drafts";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/promotion-forms";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "New coupon" };

export default async function NewCouponPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const draftId = (params.draft ?? "").trim();
  const draft = draftId ? await getAdminDraft(draftId, "coupon") : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title={draft ? "Continue coupon draft" : "New coupon"}
        description={
          draft
            ? "Your unfinished code is back in place. It is only live once you create it."
            : "Create a code with a clear discount, audience and usage rules."
        }
        actions={
          <Link
            href="/admin/coupons"
            className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Coupons
          </Link>
        }
      />
      {draftId && !draft ? (
        <div className="mt-6">
          <FormMessage
            tone="info"
            message="That draft is no longer available. Starting a new coupon instead."
          />
        </div>
      ) : null}
      <CouponForm draft={draft ? { id: draft.id, payload: draft.payload } : null} />
    </div>
  );
}
