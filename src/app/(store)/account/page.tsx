import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PackageSearch, Sparkles } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getMyBusiness, getMyOrders } from "@/lib/data/account";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form";
import { OrderSummaryRow } from "@/components/orders/order-summary-row";
import { isActiveOrder } from "@/components/orders/order-status-badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer("/account");
  const user = viewer.user;
  if (!user) return null;

  const [orders, business] = await Promise.all([
    getMyOrders(user.id, 100),
    getMyBusiness(user.id),
  ]);

  const activeOrders = orders.filter((order) => isActiveOrder(order.status));
  const recent = orders.slice(0, 4);
  const tradeLabel =
    business?.status === "approved"
      ? "Approved"
      : business?.status === "pending"
        ? "In review"
        : business?.status === "rejected"
          ? "Needs attention"
          : "Not applied";

  return (
    <div className="space-y-10">
      {params.password === "updated" ? (
        <FormMessage tone="success" message="Your password has been updated." />
      ) : null}

      <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="group border border-line bg-cream p-5 transition-colors hover:border-ink/30"
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Orders placed
          </p>
          <p className="mt-3 font-serif text-4xl font-light">{orders.length}</p>
          <p className="mt-1 flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
            {activeOrders.length} in progress
            <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>

        <Link
          href="/account/business"
          className="group border border-line bg-cream p-5 transition-colors hover:border-ink/30"
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Trade account
          </p>
          <div className="mt-3 flex items-center gap-2">
            <p className="font-serif text-2xl font-light">{tradeLabel}</p>
            {business?.status === "approved" ? <Badge tone="sage">B2B</Badge> : null}
          </div>
          <p className="mt-2 flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
            {business?.status === "approved"
              ? "Wholesale pricing active"
              : business?.status === "pending"
                ? "We are reviewing your GSTIN"
                : "Unlock wholesale pricing"}
            <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>

        <Link
          href="/account/profile"
          className="group border border-line bg-cream p-5 transition-colors hover:border-ink/30"
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Member since
          </p>
          <p className="mt-3 font-serif text-2xl font-light">
            {viewer.profile?.created_at
              ? formatDate(viewer.profile.created_at, { month: "long", year: "numeric" })
              : "Today"}
          </p>
          <p className="mt-2 flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
            Your profile &amp; details
            <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>
      </section>

      {orders.length ? (
        <section>
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="eyebrow text-clay">Order history</p>
              <h2 className="mt-2 font-serif text-3xl font-light tracking-[-0.03em]">
                Recent orders
              </h2>
            </div>
            <Link
              href="/account/orders"
              className="link-underline shrink-0 text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-ink-soft"
            >
              All orders
            </Link>
          </div>
          <div>
            {recent.map((order) => (
              <OrderSummaryRow
                key={order.id}
                order={order}
                href={`/account/orders/${order.id}`}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="border border-line bg-cream p-8 sm:p-10">
          <Sparkles className="size-5 text-clay" strokeWidth={1.5} />
          <h2 className="mt-4 font-serif text-3xl font-light tracking-[-0.03em]">
            Your first piece awaits.
          </h2>
          <p className="mt-3 max-w-lg break-words text-sm leading-relaxed text-muted">
            Your orders will collect here once you place one. Guest purchases made with{" "}
            {user.email} will also join your account after your email is verified.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/shop" className={buttonStyles({ size: "md" })}>
              Explore the collection
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/account/business"
              className="link-underline text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-ink-soft"
            >
              Apply for trade pricing
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border border-line bg-cream/50 p-5">
          <PackageSearch className="size-4 text-clay" strokeWidth={1.5} />
          <h2 className="mt-3 font-serif text-xl">Looking for a guest order?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            If you checked out before creating an account, verify the same email and it will
            link here automatically. Or look it up with your order number.
          </p>
          <Link
            href="/track"
            className="link-underline mt-3 inline-block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay"
          >
            Track an order
          </Link>
        </div>
        <div className="border border-line bg-cream/50 p-5">
          <h2 className="font-serif text-xl">Everything in one place</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Keep your phone and name current for smooth delivery updates. We write only about
            your orders and the occasional note from Buniya.
          </p>
          <Link
            href="/account/profile"
            className="link-underline mt-3 inline-block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay"
          >
            Update your profile
          </Link>
        </div>
      </section>

      {viewer.isAdmin ? (
        <section className="flex flex-col gap-4 border border-ink bg-ink px-6 py-5 text-cream sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-cream/55">
              Studio access
            </p>
            <p className="mt-1 font-serif text-xl">You have an admin account.</p>
          </div>
          <Link
            href="/admin"
            className={buttonStyles({ variant: "inverse", size: "sm" })}
          >
            Open admin studio
            <ArrowUpRight className="size-3.5" />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
