import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Circle,
  Mail,
  MapPin,
  Package,
  ReceiptText,
  Truck,
} from "lucide-react";
import type { OrderWithDetails } from "@/lib/data/account";
import type { Address, OrderStatus } from "@/lib/types";
import {
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
} from "@/lib/constants";
import { cn, formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";

const FLOW: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

function flowRank(status: OrderStatus) {
  return FLOW.findIndex((step) => step.status === status);
}

function AddressBlock({
  address,
  email,
  phone,
}: {
  address: Address;
  email: string;
  phone: string;
}) {
  return (
    <address className="space-y-1 break-words text-sm not-italic leading-relaxed text-ink-soft">
      <p className="font-medium text-ink">{address.full_name}</p>
      <p>{address.line1}</p>
      {address.line2 ? <p>{address.line2}</p> : null}
      <p>
        {address.city}, {address.state} {address.pincode}
      </p>
      <p>{address.country}</p>
      <p className="pt-1.5 text-xs text-muted">
        {phone || address.phone} · {email || address.email}
      </p>
    </address>
  );
}

export function OrderDetailView({
  order,
  backHref,
  backLabel = "Back to orders",
  supportEmail,
  publicView = false,
}: {
  order: OrderWithDetails;
  backHref?: string;
  backLabel?: string;
  supportEmail: string;
  publicView?: boolean;
}) {
  const rank = flowRank(order.status);
  const showFlow = rank >= 0;
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const terminalNote = [
    "cancelled",
    "refund_requested",
    "refunded",
    "payment_review",
    "pending_payment",
  ].includes(order.status);

  function dateForStatus(status: OrderStatus) {
    if (status === "confirmed") return order.paid_at ?? order.created_at;
    if (status === "shipped") return order.shipped_at;
    if (status === "delivered") return order.delivered_at;
    return (
      order.events.find(
        (event) => event.status === status && event.event_type !== "order_created",
      )?.created_at ?? null
    );
  }

  return (
    <div>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
        >
          <ArrowUpRight className="size-3.5 rotate-[-135deg]" />
          {backLabel}
        </Link>
      ) : null}

      <div className="mt-6 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">Order {order.order_number}</p>
          <h1 className="mt-3 font-serif text-[clamp(2.3rem,4.5vw,3.6rem)] font-light leading-[1.02] tracking-[-0.04em]">
            {ORDER_STATUS_LABELS[order.status]}
          </h1>
          <p className="mt-3 text-sm text-muted">
            Placed {formatDate(order.created_at)} · {itemCount}{" "}
            {itemCount === 1 ? "piece" : "pieces"} · {order.buyer_type === "b2b" ? "Trade order" : "Retail order"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:flex-col sm:items-end">
          <OrderStatusBadge status={order.status} />
          <p className="font-serif text-2xl">{formatMoney(order.total_amount)}</p>
          {order.invoice_number ? (
            <Link
              href={`/invoice/${order.access_token}`}
              className="inline-flex max-w-full items-center gap-1.5 break-all text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-clay-deep underline decoration-clay/40 underline-offset-4 transition-colors hover:text-ink"
            >
              <ReceiptText className="size-3.5" aria-hidden />
              Invoice {order.invoice_number}
            </Link>
          ) : null}
        </div>
      </div>

      {publicView ? (
        <p className="mt-5 flex items-start gap-2 border border-line bg-cream/60 px-4 py-3 text-xs leading-relaxed text-muted">
          <ReceiptText className="mt-0.5 size-3.5 shrink-0" />
          This is a private order link. Keep it for your records — anyone with the link can
          view this order.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] lg:gap-10">
        <div className="space-y-8">
          {terminalNote ? (
            <div className="border border-clay/25 bg-clay/5 px-5 py-4">
              <p className="text-sm leading-relaxed text-ink-soft">
                {ORDER_STATUS_DESCRIPTIONS[order.status]}
              </p>
            </div>
          ) : showFlow ? (
            <section aria-label="Order progress" className="overflow-hidden border border-line bg-cream/60 p-5 sm:p-6">
              <div className="flex flex-wrap gap-y-5">
                {FLOW.map((step, index) => {
                  const complete = index <= rank;
                  const date = dateForStatus(step.status);
                  return (
                    <div
                      key={step.status}
                      className="relative flex min-w-[6.5rem] flex-1 flex-col items-center text-center"
                    >
                      {index < FLOW.length - 1 ? (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-1/2 top-[0.65rem] h-px w-full",
                            index < rank ? "bg-sage" : "bg-line",
                          )}
                        />
                      ) : null}
                      <span
                        className={cn(
                          "relative z-10 flex size-5 items-center justify-center rounded-full border",
                          complete
                            ? "border-sage bg-sage text-cream"
                            : "border-line bg-cream text-muted",
                        )}
                      >
                        {complete ? (
                          <Check className="size-3" strokeWidth={2} />
                        ) : (
                          <Circle className="size-2 fill-current" strokeWidth={0} />
                        )}
                      </span>
                      <span
                        className={cn(
                          "mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em]",
                          complete ? "text-ink" : "text-muted",
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="mt-1 min-h-3 text-[0.58rem] text-muted">
                        {date ? formatDate(date) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="border border-line bg-cream">
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                <Package className="size-3.5" strokeWidth={1.5} />
                Pieces in this order
              </h2>
              <span className="text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                {itemCount} {itemCount === 1 ? "piece" : "pieces"}
              </span>
            </header>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-5">
                  <div className="relative size-20 shrink-0 overflow-hidden bg-sand">
                    {item.image_url ? (
                      <SafeImage
                        src={item.image_url}
                        alt={item.name}
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg leading-snug">{item.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.variant_label ?? (item.item_type === "combo" ? "Bundle" : null)}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                    {item.metadata?.components?.length ? (
                      <ul className="mt-2 space-y-0.5 text-[0.68rem] text-muted">
                        {item.metadata.components.map((component, index) => (
                          <li key={`${component.variant_id}-${index}`}>
                            {component.product_name} · {component.variant_label} ×{" "}
                            {component.quantity}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-2 text-xs text-ink-soft">
                      {formatMoney(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-lg">
                    {formatMoney(item.line_total)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {order.events.length ? (
            <section className="border border-line bg-cream/60 p-5 sm:p-6">
              <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Order notes
              </h2>
              <ol className="mt-5 space-y-5 border-l border-line pl-5">
                {order.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[1.4rem] top-1 size-2 rounded-full border border-line bg-cream"
                    />
                    <p className="text-sm leading-relaxed text-ink-soft">{event.message}</p>
                    <p className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                      {formatDateTime(event.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {order.customer_note ? (
            <section className="border border-line bg-cream p-5">
              <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Your note
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{order.customer_note}</p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="border border-line bg-cream p-5">
            <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Payment summary
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              {order.discount_amount > 0 ? (
                <div className="flex justify-between gap-4 text-sage">
                  <dt>
                    Discount{order.coupon_code ? ` · ${order.coupon_code}` : ""}
                  </dt>
                  <dd>− {formatMoney(order.discount_amount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Shipping</dt>
                <dd>
                  {order.shipping_amount > 0
                    ? formatMoney(order.shipping_amount)
                    : "Quoted after order"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
                <dt>Total</dt>
                <dd className="font-serif text-lg">{formatMoney(order.total_amount)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-xs text-muted">
                <dt>Amount paid</dt>
                <dd>{formatMoney(order.amount_paid)}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[0.6rem] uppercase tracking-[0.1em] text-muted">
              Prices include GST · {formatMoney(order.tax_amount)} tax component
            </p>
            {order.payment_status === "paid" && order.paid_at ? (
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.1em] text-sage">
                Paid {formatDate(order.paid_at)}
              </p>
            ) : null}
          </section>

          <section className="border border-line bg-cream p-5">
            <h2 className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              <MapPin className="size-3.5" strokeWidth={1.5} />
              Shipping to
            </h2>
            <div className="mt-3">
              <AddressBlock
                address={order.shipping_address}
                email={order.email}
                phone={order.phone}
              />
            </div>
            {order.business_legal_name || order.business_gstin ? (
              <div className="mt-4 border-t border-line pt-3 text-xs text-muted">
                <p>{order.business_legal_name}</p>
                {order.business_gstin ? <p>GSTIN {order.business_gstin}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="border border-line bg-cream p-5">
            <h2 className="flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              <Truck className="size-3.5" strokeWidth={1.5} />
              Delivery
            </h2>
            {order.tracking_number || order.tracking_url ? (
              <div className="mt-3 space-y-2 text-sm">
                {order.shipping_carrier ? (
                  <p className="text-muted">{order.shipping_carrier}</p>
                ) : null}
                {order.tracking_number ? (
                  <p className="font-medium">{order.tracking_number}</p>
                ) : null}
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline inline-flex items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-clay"
                  >
                    Track parcel
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Tracking details appear here once your parcel leaves the studio.
              </p>
            )}

            <div className="mt-4 border-t border-line pt-3">
              {order.shipping_payment_status === "paid" ? (
                <Badge tone="sage">Shipping paid</Badge>
              ) : order.shipping_payment_status === "pending" ? (
                <div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Shipping payment is pending
                    {order.shipping_amount > 0
                      ? ` · ${formatMoney(order.shipping_amount)}`
                      : ""}
                    .
                  </p>
                  {order.shipping_payment_link_url ? (
                    <a
                      href={order.shipping_payment_link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-clay px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
                    >
                      Pay shipping securely
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      We will email a secure payment link before dispatch.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted">
                  Shipping is quoted after your order and sent by email before dispatch.
                </p>
              )}
            </div>
          </section>

          <section className="border border-line bg-ink p-5 text-cream">
            <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-cream/60">
              Need a hand?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">
              Write to the studio with your order number and we will help with delivery,
              changes or returns.
            </p>
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent(
                `Order ${order.order_number}`,
              )}`}
              className="mt-4 inline-flex max-w-full items-center gap-2 break-all text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-cream underline-offset-4 hover:underline"
            >
              <Mail className="size-3.5" />
              {supportEmail}
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
