import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText, Search } from "lucide-react";
import { getAdminOrders } from "@/lib/data/admin";
import {
  AdminPageHeader,
  DataTable,
  Pagination,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Part refunded",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const requestedStatus = params.status ?? "all";
  const status: OrderStatus | "all" = (ORDER_STATUSES as readonly string[]).includes(
    requestedStatus,
  )
    ? (requestedStatus as OrderStatus)
    : "all";
  const search = (params.q ?? "").trim().slice(0, 80);
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const result = await getAdminOrders({ status, search, page });
  const hasFilters = status !== "all" || Boolean(search);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Every retail and trade purchase in one queue. Update statuses, add tracking, quote shipping and email customers."
        actions={
          <Link
            href="/admin/orders?status=confirmed"
            className="border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
          >
            Needs packing
          </Link>
        }
      />

      <div className="mt-6">
        <Panel bodyClassName="px-5 py-4">
          <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={search}
                placeholder="Order number, email, phone or customer name"
              />
            </div>
            <div className="lg:w-56">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {ORDER_STATUS_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="md" className="h-11">
                <Search className="size-3.5" aria-hidden />
                Filter
              </Button>
              {hasFilters ? (
                <Link
                  href="/admin/orders"
                  className="inline-flex h-11 items-center px-3 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-ink"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel bodyClassName="pt-4">
          {result.orders.length ? (
            <>
              <DataTable minWidth="min-w-[860px]">
                <thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Buyer</Th>
                    <Th>Channel</Th>
                    <Th>Status</Th>
                    <Th>Payment</Th>
                    <Th>Total</Th>
                    <Th>Placed</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.orders.map((order) => (
                    <tr key={order.id} className="group">
                      <Td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-ink transition-colors group-hover:text-clay-deep"
                        >
                          {order.order_number}
                        </Link>
                        {order.invoice_number ? (
                          <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                            Invoice {order.invoice_number}
                          </p>
                        ) : null}
                      </Td>
                      <Td>
                        <span className="block max-w-[16rem] truncate">
                          {order.customer_name}
                        </span>
                        <span className="block max-w-[16rem] truncate text-[0.68rem] text-muted">
                          {order.email}
                        </span>
                      </Td>
                      <Td>
                        <Pill tone={order.buyer_type === "b2b" ? "info" : "neutral"}>
                          {order.buyer_type === "b2b" ? "Trade" : "Retail"}
                        </Pill>
                      </Td>
                      <Td>
                        <OrderStatusBadge status={order.status} />
                      </Td>
                      <Td className="text-[0.72rem] text-ink-soft">
                        {PAYMENT_LABELS[order.payment_status]}
                      </Td>
                      <Td className="whitespace-nowrap font-medium">
                        {formatMoney(order.total_amount)}
                      </Td>
                      <Td className="whitespace-nowrap text-[0.68rem] text-muted">
                        {formatDateTime(order.created_at)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
              <div className="mt-4 border-t border-line pt-4">
                <Pagination
                  basePath="/admin/orders"
                  page={result.page}
                  pageSize={result.pageSize}
                  total={result.total}
                  params={{
                    status: status === "all" ? undefined : status,
                    q: search || undefined,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <ReceiptText className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-2xl font-light tracking-[-0.02em]">
                {hasFilters ? "No orders match those filters" : "No orders yet"}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                {hasFilters
                  ? "Try a different status or clear the search to see the full queue."
                  : "New purchases appear here automatically. Guest and account orders are both captured."}
              </p>
              {hasFilters ? (
                <Link
                  href="/admin/orders"
                  className="mt-6 border border-line px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-ink"
                >
                  Clear filters
                </Link>
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
