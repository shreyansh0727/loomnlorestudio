import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminPopupOffer } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { PopupForm } from "@/components/admin/content-forms";

export const metadata: Metadata = { title: "Edit popup" };

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const popup = await getAdminPopupOffer(id);
  if (!popup) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title={popup.headline}
        description={`${popup.is_active ? "Active" : "Paused"} · shown ${popup.frequency.replaceAll(
          "_",
          " ",
        )}`}
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
      <PopupForm popup={popup} />
    </div>
  );
}
