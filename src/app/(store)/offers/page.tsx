import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, Sparkles, ArrowRight } from "lucide-react";
import { getPublicCombos, getPublicCoupons } from "@/lib/data/promotions";
import { getViewer } from "@/lib/auth";
import { isCouponInSchedule } from "@/lib/pricing";
import { formatDate, formatMoney } from "@/lib/utils";
import { CopyCode } from "@/components/store/copy-code";
import { ComboCard } from "@/components/product/combo-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offers & combos",
  description:
    "Current coupon codes and fixed bundles from Loom & Lore. Retail and trade offers, applied at checkout.",
};

export default async function OffersPage() {
  const viewer = await getViewer();
  const buyerType = viewer.isB2B ? "b2b" : "b2c";
  const [coupons, combos] = await Promise.all([
    getPublicCoupons({ showInOffersOnly: true, buyerType }),
    getPublicCombos({ buyerType }),
  ]);

  const activeCoupons = coupons.filter((coupon) => isCouponInSchedule(coupon));

  return (
    <>
      <section className="paper-edge relative overflow-hidden border-b border-line bg-cream/60">
        <div className="editorial-container relative py-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow text-clay">Offers from the studio</p>
            <h1 className="display-title mt-4 text-[clamp(2.8rem,6vw,5.4rem)]">
              Small kindnesses,
              <br />
              woven in.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              A welcome code for the first visit, considered bundles that cost less
              together, and wholesale terms for approved trade accounts. One code per
              order; always applied before payment.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6 text-[0.64rem] uppercase tracking-[0.14em] text-muted">
            <span className="inline-flex items-center gap-2">
              <Ticket className="size-3.5 text-clay" /> Codes copied in one tap
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-3.5 text-clay" /> Tax-inclusive pricing
            </span>
            <span className="inline-flex items-center gap-2">
              <ArrowRight className="size-3.5 text-clay" /> Applied at checkout
            </span>
          </div>
        </div>
      </section>

      <section className="editorial-container py-14 lg:py-20">
        <SectionHeading
          eyebrow="Coupon codes"
          title="A little off, for you"
          description={
            viewer.isB2B
              ? "Trade offers for approved business accounts. Wholesale minimums apply."
              : "Welcome and seasonal codes for retail orders. Minimum spends and expiry dates are noted on each."
          }
        />

        {activeCoupons.length ? (
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:mt-12 lg:gap-6">
            {activeCoupons.map((coupon) => (
              <article
                key={coupon.id}
                id={`coupon-${coupon.code.toLowerCase()}`}
                className="relative scroll-mt-28 overflow-hidden border border-line bg-cream p-6 sm:p-7"
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 size-32 rounded-full border border-clay/15"
                />
                <div
                  aria-hidden
                  className="absolute -right-4 -top-4 size-20 rounded-full border border-clay/10"
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-clay">
                      {coupon.audience === "b2b" ? "Trade coupon" : "Retail coupon"}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl font-light tracking-[-0.025em]">
                      {coupon.label ?? `${coupon.code} offer`}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                      {coupon.description ??
                        "Use this code at checkout to apply the offer to your order."}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-ink px-3 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.13em] text-cream sm:inline-flex">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}% off`
                      : `${formatMoney(coupon.discount_value)} off`}
                  </span>
                </div>

                <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-line pt-5">
                  <CopyCode code={coupon.code} label="Copy coupon" />
                  <ul className="space-y-1 text-right text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                    {coupon.min_order_amount > 0 ? (
                      <li>Min. order {formatMoney(coupon.min_order_amount)}</li>
                    ) : null}
                    {coupon.max_discount_amount ? (
                      <li>Up to {formatMoney(coupon.max_discount_amount)} off</li>
                    ) : null}
                    {coupon.first_order_only ? <li>First order only</li> : null}
                    {coupon.ends_at ? <li>Ends {formatDate(coupon.ends_at)}</li> : null}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-9"
            icon={<Ticket className="size-6" strokeWidth={1.4} />}
            title="No coupon codes just now"
            description="Bundle savings are still available below, and the studio letter announces new codes first."
            action={
              <Link href="/shop" className={buttonStyles({ size: "md", variant: "secondary" })}>
                Continue shopping
              </Link>
            }
          />
        )}
      </section>

      <section className="border-t border-line bg-cream/60 py-14 lg:py-20">
        <div className="editorial-container">
          <SectionHeading
            eyebrow="Fixed bundles"
            title="Better together"
            description="A short list of pieces chosen to sit well as a set, priced below their individual retail value. Inventory is reserved from every component at checkout."
            href="/shop"
            linkLabel="Shop separately"
          />

          {combos.length ? (
            <div className="mt-9 grid gap-6 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
              {combos.map((combo) => (
                <div key={combo.id} id={`combo-${combo.slug}`} className="scroll-mt-28">
                  <ComboCard combo={combo} isB2B={viewer.isB2B} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-9"
              icon={<Sparkles className="size-6" strokeWidth={1.4} />}
              title="Bundles are being prepared"
              description="The studio is putting together the next set. Check back soon or browse the collection."
              action={
                <Link href="/shop" className={buttonStyles({ size: "md", variant: "secondary" })}>
                  Browse the collection
                </Link>
              }
            />
          )}

          <div className="mt-12 grid gap-5 border-t border-line pt-8 sm:grid-cols-3">
            {[
              {
                title: "One code per order",
                body: "Coupons cannot be combined. The best available code can be applied at checkout.",
              },
              {
                title: "Priced with GST",
                body: "All retail prices include GST. Approved business orders receive a GST invoice.",
              },
              {
                title: "Shipping quoted later",
                body: "Product payment is online. The studio quotes exact shipping separately before dispatch.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
