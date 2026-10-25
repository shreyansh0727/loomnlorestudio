import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/orders/print-button";
import type { Address, Order, OrderItem, SiteSettings } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/utils";

function AddressLines({ address }: { address: Address }) {
  return (
    <address className="not-italic leading-relaxed">
      <span className="block font-medium text-ink">{address.full_name}</span>
      <span className="block">{address.line1}</span>
      {address.line2 ? <span className="block">{address.line2}</span> : null}
      <span className="block">
        {address.city}, {address.state} {address.pincode}
      </span>
      <span className="block">{address.country}</span>
      <span className="mt-1.5 block text-muted">
        {address.phone} · {address.email}
      </span>
    </address>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-baseline justify-between gap-8 border-t border-ink/20 pt-3 text-base font-medium text-ink"
          : "flex items-baseline justify-between gap-8 text-sm"
      }
    >
      <span className={muted ? "text-muted" : "text-ink-soft"}>{label}</span>
      <span className={muted ? "text-muted" : "text-ink"}>{value}</span>
    </div>
  );
}

export function InvoiceDocument({
  order,
  items,
  settings,
  backHref,
  backLabel = "Back to order",
}: {
  order: Order;
  items: OrderItem[];
  settings: SiteSettings;
  backHref: string;
  backLabel?: string;
}) {
  const isTrade = order.buyer_type === "b2b" && Boolean(order.business_gstin);
  const balance = Math.max(0, order.total_amount - order.amount_paid);
  const invoiceDate = order.paid_at ?? order.created_at;
  const sellerAddress = settings.sellerAddress;

  return (
    <div className="min-h-screen bg-paper px-4 py-7 sm:px-6 sm:py-10 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[900px] flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {backLabel}
        </Link>
        <PrintButton />
      </div>

      <article className="invoice-sheet mx-auto max-w-[900px] border border-line bg-cream px-6 py-8 text-sm text-ink-soft shadow-[0_24px_70px_-50px_rgba(30,27,23,0.45)] sm:px-10 sm:py-12 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="flex flex-col gap-8 border-b border-ink/15 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo can be any hosted asset
              <img
                src={settings.logoUrl}
                alt={settings.brandName}
                className="mb-4 h-12 w-auto max-w-[200px] object-contain"
              />
            ) : null}
            <p className="font-serif text-3xl font-light leading-none tracking-[-0.035em] text-ink">
              {settings.brandName}
            </p>
            <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-clay">
              {settings.brandTagline}
            </p>
            <div className="mt-6 text-[0.72rem] leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">{settings.sellerLegalName}</p>
              <p>{sellerAddress.line1}</p>
              {sellerAddress.line2 ? <p>{sellerAddress.line2}</p> : null}
              <p>
                {sellerAddress.city}, {sellerAddress.state} {sellerAddress.pincode}
              </p>
              <p>{sellerAddress.country}</p>
              <p className="mt-2">
                {settings.supportEmail} · {settings.supportPhone}
              </p>
              {isTrade && settings.sellerGstin ? (
                <p className="mt-1 font-medium text-ink">
                  GSTIN {settings.sellerGstin}
                </p>
              ) : null}
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-muted">
              {isTrade ? "Tax invoice" : "Retail invoice"}
            </p>
            <p className="mt-2 font-serif text-2xl font-light tracking-[-0.02em] text-ink">
              {order.invoice_number}
            </p>
            <dl className="mt-5 space-y-1.5 text-[0.72rem]">
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-4">
                <dt className="text-muted">Invoice date</dt>
                <dd className="text-ink">{formatDate(invoiceDate)}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-4">
                <dt className="text-muted">Order</dt>
                <dd className="text-ink">{order.order_number}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-4">
                <dt className="text-muted">Payment</dt>
                <dd className="capitalize text-ink">
                  {order.payment_status.replace("_", " ")}
                </dd>
              </div>
              {order.razorpay_payment_id ? (
                <div className="flex justify-between gap-6 sm:justify-end sm:gap-4">
                  <dt className="text-muted">Reference</dt>
                  <dd className="break-all text-ink">{order.razorpay_payment_id}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </header>

        <section className="grid gap-8 border-b border-ink/15 py-8 sm:grid-cols-2">
          <div>
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-muted">
              {isTrade ? "Billed to" : "Customer"}
            </p>
            <div className="mt-3 text-[0.78rem]">
              {isTrade ? (
                <>
                  <p className="font-medium text-ink">{order.business_legal_name}</p>
                  <p className="mt-1 font-medium text-ink">GSTIN {order.business_gstin}</p>
                  <div className="mt-2">
                    <AddressLines address={order.billing_address} />
                  </div>
                  <p className="mt-2 text-muted">
                    Place of supply: {order.shipping_address.state}
                  </p>
                </>
              ) : (
                <AddressLines address={order.billing_address} />
              )}
            </div>
          </div>
          <div>
            <p className="text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-muted">
              Shipped to
            </p>
            <div className="mt-3 text-[0.78rem]">
              <AddressLines address={order.shipping_address} />
            </div>
          </div>
        </section>

        <section className="py-2">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/20 text-[0.56rem] uppercase tracking-[0.16em] text-muted">
                <th className="py-3 pr-4 font-semibold">Piece</th>
                <th className="px-3 py-3 text-right font-semibold">Qty</th>
                <th className="px-3 py-3 text-right font-semibold">Rate</th>
                <th className="py-3 pl-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-ink">{item.name}</p>
                    {item.variant_label ? (
                      <p className="mt-0.5 text-[0.7rem] text-muted">
                        {item.variant_label}
                        {item.sku ? ` · ${item.sku}` : ""}
                      </p>
                    ) : item.sku ? (
                      <p className="mt-0.5 text-[0.7rem] text-muted">{item.sku}</p>
                    ) : null}
                    {item.metadata.components?.length ? (
                      <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
                        {item.metadata.components
                          .map(
                            (component) =>
                              `${component.product_name} (${component.variant_label}) × ${component.quantity}`,
                          )
                          .join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-right tabular-nums">
                    {formatMoney(item.unit_price)}
                  </td>
                  <td className="whitespace-nowrap py-4 pl-4 text-right tabular-nums text-ink">
                    {formatMoney(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-4 grid gap-8 border-t border-ink/15 pt-6 sm:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3 text-[0.7rem] leading-relaxed text-muted">
            <p>
              Prices are inclusive of GST. Shipping is quoted by us and billed
              separately at actuals.
            </p>
            {order.coupon_code ? (
              <p>
                Coupon applied: <span className="text-ink-soft">{order.coupon_code}</span>
                {order.coupon_label ? ` — ${order.coupon_label}` : ""}
              </p>
            ) : null}
            <p>
              Custom and made-to-order pieces are final sale. Returns on ready-made
              accessories are governed by the returns policy shared on our website.
            </p>
            <p>
              Questions about this invoice? Write to {settings.supportEmail}.
            </p>
          </div>
          <div className="space-y-2.5">
            <SummaryRow
              label="Subtotal"
              value={formatMoney(order.subtotal)}
            />
            {order.discount_amount > 0 ? (
              <SummaryRow
                label="Discount"
                value={`− ${formatMoney(order.discount_amount)}`}
              />
            ) : null}
            {order.shipping_amount > 0 ? (
              <SummaryRow
                label="Shipping"
                value={formatMoney(order.shipping_amount)}
              />
            ) : (
              <SummaryRow label="Shipping" value="Quoted separately" muted />
            )}
            <div className="pt-1">
              <SummaryRow
                label={`GST included (${order.tax_rate}%)`}
                value={formatMoney(order.tax_amount)}
                muted
              />
            </div>
            <SummaryRow
              label="Invoice total"
              value={formatMoney(order.total_amount)}
              strong
            />
            <SummaryRow label="Amount paid" value={formatMoney(order.amount_paid)} />
            {balance > 0 ? (
              <SummaryRow label="Balance due" value={formatMoney(balance)} strong />
            ) : null}
            {order.shipping_payment_status === "pending" || balance > 0 ? (
              <p className="pt-2 text-[0.68rem] leading-relaxed text-clay-deep">
                Shipping is payable through the secure Razorpay link sent by us.
                Orders are dispatched after the shipping charge is settled.
              </p>
            ) : null}
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-6 border-t border-ink/15 pt-6 text-[0.66rem] leading-relaxed text-muted sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-medium text-ink">Thank you for choosing {settings.brandName}.</p>
            <p className="mt-1">
              Every piece is cut, checked and packed by hand in our workroom.
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-medium text-ink">{settings.sellerLegalName}</p>
            <p className="mt-6 border-t border-muted/40 pt-2 sm:min-w-48">
              Authorised signatory
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
