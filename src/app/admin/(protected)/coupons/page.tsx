import type { Metadata } from "next";
import Link from "next/link";
import { TicketPercent } from "lucide-react";
import { getAdminCoupons } from "@/lib/data/admin";
import { toggleCouponActiveAction } from "@/lib/actions/admin/promotions";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormMessage } from "@/components/ui/form";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Coupons" };

function discountSummary(coupon: Awaited<ReturnType<typeof getAdminCoupons>>[number]) {
  if (coupon.discount_type === "percentage") {
    return `${coupon.discount_value}%${
      coupon.max_discount_amount ? ` up to ${formatMoney(coupon.max_discount_amount)}` : ""
    }`;
  }
  return formatMoney(coupon.discount_value);
}

function scheduleSummary(coupon: Awaited<ReturnType<typeof getAdminCoupons>>[number]) {
  if (!coupon.starts_at && !coupon.ends_at) return "Always on";
  if (coupon.starts_at && coupon.ends_at) {
    return `${formatDate(coupon.starts_at)} – ${formatDate(coupon.ends_at)}`;
  }
  if (coupon.starts_at) return `From ${formatDate(coupon.starts_at)}`;
  return `Until ${formatDate(coupon.ends_at)}`;
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ saved }, coupons] = await Promise.all([searchParams, getAdminCoupons()]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title="Coupons"
        description="New-customer codes, seasonal offers and trade incentives. Public codes can also appear in the offer ticker."
        actions={
          <Link
            href="/admin/coupons/new"
            className="bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
          >
            New coupon
          </Link>
        }
      />

      {saved ? (
        <div className="mt-6">
          <FormMessage
            tone="success"
            message={`Coupon "${saved}" saved. It is available at checkout according to its schedule and limits.`}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <Panel bodyClassName="pt-4">
          {coupons.length ? (
            <DataTable minWidth="min-w-[920px]">
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Discount</Th>
                  <Th>Audience</Th>
                  <Th>Used</Th>
                  <Th>Schedule</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="group">
                    <Td>
                      <Link
                        href={`/admin/coupons/${coupon.id}`}
                        className="font-mono text-[0.74rem] font-semibold tracking-[0.03em] transition-colors group-hover:text-clay-deep"
                      >
                        {coupon.code}
                      </Link>
                      <p className="mt-0.5 max-w-[16rem] truncate text-[0.66rem] text-muted">
                        {coupon.label ?? coupon.description ?? "No label"}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-[0.72rem]">
                      {discountSummary(coupon)}
                      {coupon.min_order_amount > 0 ? (
                        <span className="block text-[0.62rem] text-muted">
                          Min {formatMoney(coupon.min_order_amount)}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-[0.7rem] capitalize text-ink-soft">
                      {coupon.audience === "all" ? "All buyers" : coupon.audience}
                      {coupon.first_order_only ? (
                        <span className="block text-[0.62rem] text-muted">First order</span>
                      ) : null}
                    </Td>
                    <Td className="text-[0.72rem]">
                      {coupon.redemption_count}
                      {coupon.usage_limit ? (
                        <span className="text-muted"> / {coupon.usage_limit}</span>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-[0.68rem] text-muted">
                      {scheduleSummary(coupon)}
                    </Td>
                    <Td>
                      {coupon.is_active ? (
                        <Pill tone="positive">Active</Pill>
                      ) : (
                        <Pill>Paused</Pill>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/coupons/${coupon.id}`}
                          className="border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                        >
                          Edit
                        </Link>
                        <ActionButton
                          action={toggleCouponActiveAction}
                          fields={{ id: coupon.id, nextActive: !coupon.is_active }}
                          variant="ghost"
                          size="sm"
                          className="border border-line px-2.5 py-1.5 text-[0.56rem]"
                          pendingLabel="Saving"
                        >
                          {coupon.is_active ? "Pause" : "Activate"}
                        </ActionButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <TicketPercent className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-2xl font-light tracking-[-0.02em]">
                No coupons yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Create a welcome code or a seasonal offer. Coupons apply automatically
                at checkout when the code matches.
              </p>
              <Link
                href="/admin/coupons/new"
                className="mt-6 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
              >
                New coupon
              </Link>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
