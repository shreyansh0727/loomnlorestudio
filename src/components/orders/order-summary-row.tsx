import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { OrderWithDetails } from "@/lib/data/account";
import { formatDate, formatMoney, pluralise } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export function OrderSummaryRow({
  order,
  href,
}: {
  order: OrderWithDetails;
  href: string;
}) {
  const pieces = (order.items ?? []).reduce((total, item) => total + item.quantity, 0);

  return (
    <Link
      href={href}
      className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-b border-line py-5 transition-colors hover:bg-cream/60 sm:grid-cols-[1.1fr_auto_auto_1.5rem] sm:gap-6 sm:px-2"
    >
      <div className="min-w-0">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-clay">
          {order.order_number}
        </p>
        <p className="mt-1.5 text-sm text-ink">
          {formatDate(order.created_at)}
          <span className="text-muted">
            {" "}
            · {pieces} {pluralise(pieces, "piece")}
          </span>
        </p>
      </div>
      <OrderStatusBadge status={order.status} />
      <p className="col-span-2 text-right font-serif text-lg sm:col-span-1">
        {formatMoney(order.total_amount)}
      </p>
      <ChevronRight
        aria-hidden
        className="hidden size-4 justify-self-end text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block"
      />
    </Link>
  );
}
