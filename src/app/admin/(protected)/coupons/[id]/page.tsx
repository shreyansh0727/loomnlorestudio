import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminCoupon } from "@/lib/data/admin";
import { AdminPageHeader } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/promotion-forms";

export const metadata: Metadata = { title: "Edit coupon" };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getAdminCoupon(id);
  if (!coupon) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title={coupon.code}
        description={`${coupon.label ?? "Coupon"} · ${
          coupon.is_active ? "currently active" : "paused"
        }`}
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
      <CouponForm coupon={coupon} />
    </div>
  );
}
