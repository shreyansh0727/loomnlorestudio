import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminVariantOptions } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { ComboForm } from "@/components/admin/promotion-forms";

export const metadata: Metadata = { title: "New bundle" };

export default async function NewComboPage() {
  const variants = await getAdminVariantOptions();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title="New bundle"
        description="Choose the pieces, set the bundle price and decide who can buy it."
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
      <ComboForm variants={variants} />
    </div>
  );
}
