import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getMyOrders } from "@/lib/data/account";
import { OrderSummaryRow } from "@/components/orders/order-summary-row";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const viewer = await requireViewer("/account/orders");
  const user = viewer.user;
  if (!user) return null;

  const orders = await getMyOrders(user.id, 100);

  return (
    <div>
      <div className="border-b border-line pb-5">
        <p className="eyebrow text-clay">Order history</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-light leading-[1.05] tracking-[-0.035em]">
            Every thread, accounted for.
          </h2>
          <p className="text-[0.62rem] uppercase tracking-[0.13em] text-muted">
            {orders.length} {orders.length === 1 ? "order" : "orders"} on record
          </p>
        </div>
      </div>

      {orders.length ? (
        <div className="mt-2">
          {orders.map((order) => (
            <OrderSummaryRow
              key={order.id}
              order={order}
              href={`/account/orders/${order.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag className="size-6" strokeWidth={1.4} />}
          title="No orders yet"
          description="When you place your first order — as a guest or signed in — it will be recorded here."
          action={
            <Link href="/shop" className={buttonStyles({ size: "md" })}>
              Browse the collection
            </Link>
          }
        />
      )}

      <p className="mt-8 text-xs leading-relaxed text-muted">
        Guest purchases made with {user.email} link to this account automatically once your
        email is verified. Need help with an older order?{" "}
        <Link href="/track" className="link-underline text-ink-soft">
          Look it up by order number
        </Link>
        .
      </p>
    </div>
  );
}
