import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/promotion-forms";

export const metadata: Metadata = { title: "New coupon" };

export default function NewCouponPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title="New coupon"
        description="Create a code with a clear discount, audience and usage rules."
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
      <CouponForm />
    </div>
  );
}
