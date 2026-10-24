import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  ReceiptText,
  Truck,
  User,
} from "lucide-react";
import { getAdminOrder } from "@/lib/data/admin";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import {
  CopyButton,
  OrderNoteForm,
  OrderStatusForm,
  OrderTrackingForm,
  ResendEmailButtons,
  ResolvePaymentReviewForm,
  ShippingLinkForm,
} from "@/components/admin/order-forms";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { SafeImage } from "@/components/ui/safe-image";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { Address, EmailLog, PaymentStatus } from "@/lib/types";
import { formatDateTime, formatMoney, pluralise } from "@/lib/utils";

export const metadata: Metadata = { title: "Order detail" };

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

function paymentTone(status: PaymentStatus): "positive" | "warning" | "danger" | "neutral" {
  if (status === "paid") return "positive";
  if (status === "pending") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

function AddressBlock({ address }: { address: Address }) {
  return (
    <address className="not-italic text-sm leading-relaxed text-ink-soft">
      <span className="block font-medium text-ink">{address.full_name}</span>
      <span className="block">{address.line1}</span>
      {address.line2 ? <span className="block">{address.line2}</span> : null}
      <span className="block">
        {address.city}, {address.state} {address.pincode}
      </span>
      <span className="block">{address.country}</span>
      <span className="mt-2 block text-[0.7rem] text-muted">
        {address.phone} · {address.email}
      </span>
    </address>
  );
}

function sameAddress(a: Address, b: Address) {
  return (
    a.line1 === b.line1 &&
    a.line2 === b.line2 &&
    a.city === b.city &&
    a.state === b.state &&
    a.pincode === b.pincode &&
    a.full_name === b.full_name
  );
}

function TotalRow({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between gap-4 border-t border-line pt-3 text-base font-semibold text-ink"
          : "flex items-baseline justify-between gap-4 text-sm text-ink-soft"
      }
    >
      <span className={muted ? "text-muted" : undefined}>{label}</span>
      <span className={muted ? "text-muted" : undefined}>{value}</span>
    </div>
  );
}

function emailTone(status: EmailLog["status"]): "positive" | "warning" | "danger" {
  if (status === "sent") return "positive";
  if (status === "skipped") return "warning";
  return "danger";
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminOrder(id);
  if (!detail) notFound();

  const { order, items, events, emails } = detail;
  const balance = Math.max(0, order.total_amount - order.amount_paid);
  const shippingPaid = order.shipping_payment_status === "paid";
  const showBilling =
    order.buyer_type === "b2b" || !sameAddress(order.shipping_address, order.billing_address);

  const milestones = [
    { label: "Paid", value: order.paid_at },
    { label: "Shipped", value: order.shipped_at },
    { label: "Delivered", value: order.delivered_at },
    { label: "Cancelled", value: order.cancelled_at },
    { label: "Refunded", value: order.refunded_at },
  ].filter((milestone) => milestone.value);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Order detail"
        title={order.order_number}
        description={`Placed ${formatDateTime(order.created_at)} · ${
          order.buyer_type === "b2b" ? "Trade order" : "Retail order"
        }${order.invoice_number ? ` · Invoice ${order.invoice_number}` : ""}`}
        actions={
          <>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Orders
            </Link>
            <a
              href={`/order/${order.access_token}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Customer view
            </a>
            {order.invoice_number ? (
              <a
                href={`/invoice/${order.access_token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
              >
                <ReceiptText className="size-3.5" aria-hidden />
                Invoice
              </a>
            ) : null}
          </>
        }
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={order.status} />
        <Pill tone={paymentTone(order.payment_status)}>
          {PAYMENT_LABELS[order.payment_status]}
        </Pill>
        {order.shipping_payment_status !== "not_required" ? (
          <Pill tone={shippingPaid ? "positive" : "warning"}>
            {shippingPaid ? "Shipping paid" : "Shipping payment pending"}
          </Pill>
        ) : null}
        {balance > 0 ? (
          <Pill tone="warning">{formatMoney(balance)} due</Pill>
        ) : null}
      </div>

      <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel
            title="Pieces"
            description={`${items.reduce((total, item) => total + item.quantity, 0)} ${pluralise(
              items.reduce((total, item) => total + item.quantity, 0),
              "unit",
            )} across ${items.length} ${pluralise(items.length, "line")}`}
            bodyClassName="pt-3"
          >
            {items.length ? (
              <DataTable minWidth="min-w-[620px]">
                <thead>
                  <tr>
                    <Th>Item</Th>
                    <Th>Qty</Th>
                    <Th>Unit price</Th>
                    <Th className="text-right">Line total</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden border border-line bg-sand">
                            <SafeImage
                              src={item.image_url}
                              alt={item.name}
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 font-medium">
                              {item.name}
                              {item.item_type === "combo" ? (
                                <Pill tone="info">Bundle</Pill>
                              ) : null}
                            </p>
                            {item.variant_label ? (
                              <p className="text-[0.68rem] text-muted">
                                {item.variant_label}
                                {item.sku ? ` · ${item.sku}` : ""}
                              </p>
                            ) : null}
                            {item.metadata?.components?.length ? (
                              <ul className="mt-1 space-y-0.5 text-[0.66rem] text-muted">
                                {item.metadata.components.map((component, index) => (
                                  <li key={`${component.variant_id}-${index}`}>
                                    {component.product_name} · {component.variant_label} ×{" "}
                                    {component.quantity}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">{item.quantity}</Td>
                      <Td className="whitespace-nowrap">{formatMoney(item.unit_price)}</Td>
                      <Td className="whitespace-nowrap text-right font-medium">
                        {formatMoney(item.line_total)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <p className="py-4 text-sm text-muted">No line items recorded.</p>
            )}
          </Panel>

          <Panel title="Payment summary" bodyClassName="space-y-3">
            <TotalRow label="Subtotal" value={formatMoney(order.subtotal)} />
            {order.discount_amount > 0 ? (
              <TotalRow
                label={`Discount${order.coupon_code ? ` · ${order.coupon_code}` : ""}`}
                value={`− ${formatMoney(order.discount_amount)}`}
              />
            ) : null}
            <TotalRow
              label="Shipping"
              value={
                order.shipping_amount > 0
                  ? formatMoney(order.shipping_amount)
                  : "Quoted after confirmation"
              }
              muted={order.shipping_amount === 0}
            />
            <TotalRow
              label={`GST included (${order.tax_rate}%)`}
              value={formatMoney(order.tax_amount)}
              muted
            />
            <TotalRow label="Order total" value={formatMoney(order.total_amount)} strong />
            <TotalRow label="Amount paid" value={formatMoney(order.amount_paid)} />
            {balance > 0 ? (
              <TotalRow label="Balance due" value={formatMoney(balance)} />
            ) : null}
            {order.refund_amount > 0 ? (
              <TotalRow
                label={`Refunded${order.refund_reference ? ` · ${order.refund_reference}` : ""}`}
                value={formatMoney(order.refund_amount)}
              />
            ) : null}
            <p className="pt-2 text-[0.68rem] leading-relaxed text-muted">
              Prices are tax-inclusive.{" "}
              {order.buyer_type === "b2b"
                ? "A GST invoice is issued against the buyer's GSTIN."
                : "A retail invoice is issued for this order."}{" "}
              Shipping is quoted and collected separately.
            </p>
          </Panel>

          <Panel
            title="Timeline"
            description="Internal history of this order."
            bodyClassName="pt-4"
          >
            {events.length ? (
              <ol className="relative space-y-5 border-l border-line pl-5">
                {events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute -left-[1.42rem] top-1.5 size-2 rounded-full bg-clay"
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted">
                        {event.event_type.replaceAll("_", " ")}
                      </p>
                      <p className="text-[0.62rem] text-muted">
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                      {event.message}
                    </p>
                    {event.status ? (
                      <p className="mt-1 text-[0.62rem] text-muted">
                        Status: {ORDER_STATUS_LABELS[event.status]}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">No events recorded yet.</p>
            )}

            {order.internal_notes ? (
              <div className="mt-6 border border-line bg-paper/60 px-4 py-3">
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Internal notes
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {order.internal_notes}
                </p>
              </div>
            ) : null}

            <div className="mt-6 border-t border-line pt-5">
              <OrderNoteForm orderId={order.id} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer" bodyClassName="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center border border-line bg-paper text-clay-deep">
                <User className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-ink">{order.customer_name}</p>
                <p className="mt-0.5 truncate text-[0.72rem] text-muted">{order.email}</p>
                <p className="text-[0.72rem] text-muted">{order.phone}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill tone={order.buyer_type === "b2b" ? "info" : "neutral"}>
                    {order.buyer_type === "b2b" ? "Trade account" : "Retail"}
                  </Pill>
                  {order.user_id ? <Pill>Signed in</Pill> : <Pill>Guest</Pill>}
                </div>
              </div>
            </div>

            {order.buyer_type === "b2b" ? (
              <div className="border-t border-line pt-4 text-sm">
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Business
                </p>
                <p className="mt-1.5 font-medium">{order.business_legal_name ?? "—"}</p>
                <p className="text-[0.72rem] text-muted">
                  GSTIN {order.business_gstin ?? "not provided"}
                </p>
              </div>
            ) : null}

            {order.customer_note ? (
              <div className="border-t border-line pt-4">
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Customer note
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {order.customer_note}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <a
                href={`mailto:${order.email}`}
                className="inline-flex items-center gap-1.5 border border-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                <Mail className="size-3.5" aria-hidden />
                Email
              </a>
              <a
                href={`tel:${order.phone}`}
                className="inline-flex items-center gap-1.5 border border-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Call
              </a>
            </div>
          </Panel>

          <Panel title="Delivery" bodyClassName="space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
              <div>
                <p className="mb-2 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Shipping address
                </p>
                <AddressBlock address={order.shipping_address} />
              </div>
            </div>
            {showBilling ? (
              <div className="flex items-start gap-3 border-t border-line pt-5">
                <ReceiptText className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
                <div>
                  <p className="mb-2 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                    Billing address
                  </p>
                  <AddressBlock address={order.billing_address} />
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Fulfilment"
            description="Changing status can notify the customer."
            bodyClassName="space-y-5"
          >
            {order.status === "payment_review" ? (
              <div className="border border-clay/30 bg-clay/5 p-4">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-clay-deep">
                  Payment captured · stock review
                </p>
                <div className="mt-2">
                  <ResolvePaymentReviewForm orderId={order.id} />
                </div>
              </div>
            ) : null}
            <OrderStatusForm
              orderId={order.id}
              currentStatus={order.status}
              amountPaid={order.amount_paid || order.product_total}
            />
            {milestones.length ? (
              <ul className="space-y-1.5 border-t border-line pt-4">
                {milestones.map((milestone) => (
                  <li
                    key={milestone.label}
                    className="flex items-center justify-between gap-3 text-[0.68rem]"
                  >
                    <span className="uppercase tracking-[0.12em] text-muted">
                      {milestone.label}
                    </span>
                    <span className="text-ink-soft">{formatDateTime(milestone.value)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel
            title="Tracking"
            actions={
              order.tracking_url ? (
                <Pill tone="positive">Shared</Pill>
              ) : order.shipping_carrier ? (
                <Pill tone="warning">Saved</Pill>
              ) : null
            }
            bodyClassName="pt-4"
          >
            <OrderTrackingForm order={order} />
          </Panel>

          <Panel
            title="Shipping payment"
            actions={
              order.shipping_amount > 0 ? (
                <span className="text-sm font-medium">{formatMoney(order.shipping_amount)}</span>
              ) : null
            }
            bodyClassName="space-y-4"
          >
            {order.shipping_payment_link_url ? (
              <div className="border border-line bg-paper/60 p-3">
                <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  Payment link
                </p>
                <a
                  href={order.shipping_payment_link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-[0.72rem] text-clay-deep underline decoration-clay/40 underline-offset-2"
                >
                  {order.shipping_payment_link_url}
                </a>
                <div className="mt-2">
                  <CopyButton value={order.shipping_payment_link_url} />
                </div>
              </div>
            ) : null}

            {shippingPaid ? (
              <p className="text-sm leading-relaxed text-sage">
                Shipping has been paid. The order can be dispatched.
              </p>
            ) : order.status === "payment_review" ? (
              <p className="text-sm leading-relaxed text-clay-deep">
                Resolve the stock review before requesting shipping payment.
              </p>
            ) : order.payment_status !== "paid" ? (
              <p className="text-sm leading-relaxed text-muted">
                A shipping quote can be created once the product payment is received.
              </p>
            ) : (
              <ShippingLinkForm
                orderId={order.id}
                suggestedAmount={order.shipping_amount}
              />
            )}

            {order.razorpay_shipping_payment_id ? (
              <p className="break-all text-[0.62rem] text-muted">
                Shipping payment ID: {order.razorpay_shipping_payment_id}
              </p>
            ) : null}
          </Panel>

          <Panel title="Notifications" bodyClassName="space-y-4">
            <ResendEmailButtons orderId={order.id} />
            {emails.length ? (
              <ul className="divide-y divide-line/70 border-t border-line pt-1">
                {emails.map((email) => (
                  <li key={email.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[0.7rem] text-ink-soft">
                          {email.subject}
                        </p>
                        <p className="text-[0.62rem] text-muted">
                          {formatDateTime(email.created_at)}
                        </p>
                      </div>
                      <Pill tone={emailTone(email.status)}>{email.status}</Pill>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-line pt-4 text-[0.72rem] leading-relaxed text-muted">
                No emails logged for this order yet.
              </p>
            )}
          </Panel>
        </div>
      </div>

      {order.status === "shipped" && !order.tracking_url ? (
        <div className="mt-6 flex items-start gap-3 border border-clay/25 bg-clay/8 px-4 py-3 text-sm text-clay-deep">
          <Truck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            This order is marked shipped but has no tracking link. Add one above so the
            customer can follow the parcel.
          </p>
        </div>
      ) : null}

      {order.status === "confirmed" && shippingPaid ? (
        <div className="mt-6 flex items-start gap-3 border border-sage/25 bg-sage-light/50 px-4 py-3 text-sm text-sage">
          <Package className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>Payment and shipping are settled. The order is ready to pack and dispatch.</p>
        </div>
      ) : null}
    </div>
  );
}
