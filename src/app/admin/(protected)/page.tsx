import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Building2,
  Mail,
  Package,
  PanelsTopLeft,
  Plus,
  ReceiptText,
  TriangleAlert,
} from "lucide-react";
import { getAdminDashboard } from "@/lib/data/admin";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  StatCard,
  Td,
  Th,
} from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { buttonStyles } from "@/components/ui/button";
import type { EmailLog, PaymentStatus } from "@/lib/types";
import { formatDateTime, formatMoney, pluralise } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

const QUICK_ACTIONS = [
  {
    href: "/admin/products/new",
    label: "Add a product",
    detail: "Variants, pricing, stock",
    icon: Package,
  },
  {
    href: "/admin/coupons/new",
    label: "Create a coupon",
    detail: "Retail or trade offer",
    icon: BadgePercent,
  },
  {
    href: "/admin/content",
    label: "Edit storefront",
    detail: "Hero, rails, popups",
    icon: PanelsTopLeft,
  },
  {
    href: "/admin/businesses",
    label: "Review trade",
    detail: "GST applications",
    icon: Building2,
  },
];

function emailTone(status: EmailLog["status"]): "positive" | "warning" | "danger" {
  if (status === "sent") return "positive";
  if (status === "skipped") return "warning";
  return "danger";
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <div>
      <AdminPageHeader
        eyebrow="Studio overview"
        title="The studio, at a glance."
        description={`${dateLabel} · Revenue and fulfilment for the last 30 days.`}
        actions={
          <>
            <Link
              href="/admin/orders"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              <ReceiptText className="size-3.5" aria-hidden />
              All orders
            </Link>
            <Link
              href="/admin/products/new"
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              <Plus className="size-3.5" aria-hidden />
              New product
            </Link>
          </>
        }
      />

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue · 30 days"
          value={formatMoney(data.revenue30d, { compact: true })}
          detail="Paid orders, including shipping"
          href="/admin/orders"
          emphasis
        />
        <StatCard
          label="Orders · 30 days"
          value={String(data.orders30d)}
          detail={`${data.activeProducts} ${pluralise(data.activeProducts, "product")} live`}
          href="/admin/orders"
        />
        <StatCard
          label="Awaiting fulfilment"
          value={String(data.awaitingFulfilment)}
          detail="Confirmed, processing or packed"
          href="/admin/orders"
        />
        <StatCard
          label="Trade applications"
          value={String(data.pendingBusinesses)}
          detail="Pending GST verification"
          href="/admin/businesses?status=pending"
        />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel
          title="Recent orders"
          description="The newest purchases across retail and trade."
          actions={
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay-deep transition-colors hover:text-ink"
            >
              View all
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
          bodyClassName="pt-4"
        >
          {data.recentOrders.length ? (
            <DataTable minWidth="min-w-[640px]">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Buyer</Th>
                  <Th>Status</Th>
                  <Th>Total</Th>
                  <Th>Placed</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="group">
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-ink transition-colors group-hover:text-clay-deep"
                      >
                        {order.order_number}
                      </Link>
                      <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                        {order.buyer_type === "b2b" ? "Trade" : "Retail"}
                      </p>
                    </Td>
                    <Td>
                      <span className="block truncate">{order.customer_name}</span>
                      <span className="block truncate text-[0.68rem] text-muted">
                        {order.email}
                      </span>
                    </Td>
                    <Td>
                      <OrderStatusBadge status={order.status} />
                      <p className="mt-1 text-[0.62rem] text-muted">
                        {PAYMENT_LABELS[order.payment_status]}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap font-medium">
                      {formatMoney(order.total_amount)}
                    </Td>
                    <Td className="whitespace-nowrap text-[0.7rem] text-muted">
                      {formatDateTime(order.created_at)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <ReceiptText className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-xl font-light tracking-[-0.02em]">
                No orders yet
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Orders will land here the moment a customer checks out. Until then,
                keep an eye on your catalog and storefront.
              </p>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Low stock"
            description="Variants at or below 5 units."
            actions={
              <Link
                href="/admin/products"
                className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay-deep transition-colors hover:text-ink"
              >
                Catalog
              </Link>
            }
            bodyClassName="pt-3"
          >
            {data.lowStock.length ? (
              <ul className="divide-y divide-line/70">
                {data.lowStock.map((row) => (
                  <li key={row.variant_id}>
                    <Link
                      href={`/admin/products/${row.product_id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-clay-deep"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[0.8rem] font-medium">
                          {row.product_name}
                        </p>
                        <p className="truncate text-[0.66rem] text-muted">
                          {row.variant_label}
                          {row.sku ? ` · ${row.sku}` : ""}
                        </p>
                      </div>
                      <Pill tone={row.stock_qty === 0 ? "danger" : "warning"}>
                        {row.stock_qty === 0 ? "Sold out" : `${row.stock_qty} left`}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-3 py-2">
                <Boxes className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                <p className="text-sm leading-relaxed text-muted">
                  Everything is comfortably stocked. New low-stock warnings will
                  appear here.
                </p>
              </div>
            )}
          </Panel>

          <Panel
            title="Email activity"
            description="Latest notifications sent to customers."
            bodyClassName="pt-3"
          >
            {data.recentEmails.length ? (
              <ul className="divide-y divide-line/70">
                {data.recentEmails.map((email) => (
                  <li key={email.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[0.78rem]">{email.recipient}</p>
                        <p className="truncate text-[0.66rem] text-muted">
                          {email.subject}
                        </p>
                      </div>
                      <Pill tone={emailTone(email.status)}>{email.status}</Pill>
                    </div>
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                      {formatDateTime(email.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start gap-3 py-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
                <p className="text-sm leading-relaxed text-muted">
                  Notification history appears here once orders are placed and Resend
                  is connected.
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="font-serif text-xl font-light tracking-[-0.02em]">
              Quick actions
            </h2>
            <p className="mt-1 text-xs text-muted">The everyday studio chores.</p>
          </div>
          <Link
            href="/admin"
            className="hidden items-center gap-1 text-[0.6rem] uppercase tracking-[0.14em] text-muted sm:flex"
          >
            <TriangleAlert className="size-3" aria-hidden />
            Always save changes explicitly
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between gap-4 border border-line bg-cream px-4 py-4 transition-colors hover:border-ink/30 hover:bg-cream/60"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center border border-line bg-paper text-clay-deep">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[0.78rem] font-medium">
                      {action.label}
                    </span>
                    <span className="block text-[0.66rem] text-muted">
                      {action.detail}
                    </span>
                  </span>
                </div>
                <ArrowRight
                  className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
