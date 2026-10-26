import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock3 } from "lucide-react";
import { getOrderByToken } from "@/lib/data/account";
import { getSiteSettings } from "@/lib/data/content";
import { OrderDetailView } from "@/components/orders/order-detail-view";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function PublicOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const [order, settings] = await Promise.all([
    getOrderByToken(token),
    getSiteSettings(),
  ]);

  if (!order) notFound();

  const justPlaced = query.placed === "1" && order.payment_status === "paid";
  const underReview = order.status === "payment_review";

  return (
    <div className="editorial-container py-10 lg:py-14">
      {justPlaced ? (
        <div
          role="status"
          className="mb-8 flex items-start gap-3.5 border border-sage/30 bg-sage-light/60 px-5 py-4"
        >
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-sage text-cream">
            {underReview ? (
              <Clock3 className="size-3.5" strokeWidth={2} />
            ) : (
              <Check className="size-3.5" strokeWidth={2.2} />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xl leading-snug text-ink">
              {underReview
                ? "Payment received — we are reviewing your order."
                : "Thank you — your order is confirmed."}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {underReview
                ? "One of the pieces needs a quick stock check. We will write to you shortly with the next step."
                : `${formatMoney(order.total_amount)} paid securely. A receipt and tracking link are on their way to ${order.email}.`}{" "}
              {order.shipping_amount > 0
                ? "Shipping is included in this total."
                : "Shipping is quoted separately by email before dispatch."}
            </p>
          </div>
        </div>
      ) : null}
      <OrderDetailView
        order={order}
        backHref="/track"
        backLabel="Track another order"
        supportEmail={settings.supportEmail}
        publicView
      />
    </div>
  );
}
