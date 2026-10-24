import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminCombo, getAdminVariantOptions } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { ComboForm } from "@/components/admin/promotion-forms";

export const metadata: Metadata = { title: "Edit bundle" };

export default async function EditComboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [combo, variants] = await Promise.all([
    getAdminCombo(id),
    getAdminVariantOptions(),
  ]);
  if (!combo) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title={combo.title}
        description={`${combo.items.length} ${
          combo.items.length === 1 ? "piece" : "pieces"
        } · ${combo.is_active ? "active" : "paused"}`}
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
      <ComboForm combo={combo} variants={variants} />
    </div>
  );
}
