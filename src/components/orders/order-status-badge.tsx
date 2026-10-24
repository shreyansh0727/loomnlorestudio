import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const tones: Record<OrderStatus, string> = {
  pending_payment: "bg-sand text-ink-soft",
  payment_review: "bg-clay/10 text-clay-deep",
  confirmed: "bg-sage-light text-sage",
  processing: "bg-sage-light text-sage",
  packed: "bg-sage-light text-sage",
  shipped: "bg-ink text-cream",
  delivered: "bg-sage text-cream",
  cancelled: "bg-red-900/10 text-red-900",
  refund_requested: "bg-clay/10 text-clay-deep",
  refunded: "bg-ink/8 text-ink-soft",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.58rem] font-semibold uppercase leading-none tracking-[0.12em]",
        tones[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function isActiveOrder(status: OrderStatus) {
  return !["delivered", "cancelled", "refunded"].includes(status);
}
