import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { PopupForm } from "@/components/admin/content-forms";

export const metadata: Metadata = { title: "New popup" };

export default function NewPopupPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title="New popup"
        description="A welcome offer, a shipping note or a quiet announcement."
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
      <PopupForm />
    </div>
  );
}
