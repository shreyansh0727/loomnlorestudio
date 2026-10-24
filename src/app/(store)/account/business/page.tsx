import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock3, FileText, ShieldCheck } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getMyBusiness } from "@/lib/data/account";
import { getSiteSettings } from "@/lib/data/content";
import { BusinessForm } from "@/components/account/business-form";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form";
import { buttonStyles } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trade account",
  robots: { index: false, follow: false },
};

export default async function BusinessAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer("/account/business");
  const user = viewer.user;
  if (!user) return null;

  const [business, settings] = await Promise.all([
    getMyBusiness(user.id),
    getSiteSettings(),
  ]);

  const approved = business?.status === "approved";
  const pending = business?.status === "pending";
  const rejected = business?.status === "rejected";

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-5">
        <p className="eyebrow text-clay">Trade account</p>
        <h2 className="mt-2 font-serif text-[clamp(2rem,3.5vw,3rem)] font-light leading-[1.05] tracking-[-0.035em]">
          {approved
            ? "Wholesale access is live."
            : pending
              ? "Your application is with us."
              : "Buy by the bolt."}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {approved
            ? "Wholesale prices and per-product minimums now apply automatically across the shop."
            : pending
              ? "Our team is checking your GST details. You can keep shopping at retail prices while you wait."
              : "For studios, stores and makers: trade pricing, per-product minimums and a GST invoice for every order."}
        </p>
      </div>

      {params.submitted === "1" || pending ? (
        <FormMessage
          tone="success"
          message="Application received. We review trade applications within two working days."
        />
      ) : null}

      {approved && business ? (
        <section className="border border-sage/30 bg-sage-light/40 p-6 sm:p-8">
          <Badge tone="sage">
            <BadgeCheck className="size-3" strokeWidth={2} />
            Approved trade account
          </Badge>
          <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">
                Legal name
              </dt>
              <dd className="mt-1 text-ink">{business.legal_name}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">GSTIN</dt>
              <dd className="mt-1 tracking-[0.08em] text-ink">{business.gstin}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">
                Registered address
              </dt>
              <dd className="mt-1 leading-relaxed text-ink-soft">
                {business.address_line1}
                {business.address_line2 ? `, ${business.address_line2}` : ""}
                <br />
                {business.city}, {business.state} {business.pincode}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">Contact</dt>
              <dd className="mt-1 leading-relaxed text-ink-soft">
                {business.email}
                <br />
                {business.phone}
              </dd>
            </div>
          </dl>
          {business.admin_note ? (
            <p className="mt-5 border-t border-sage/20 pt-4 text-sm leading-relaxed text-sage">
              {business.admin_note}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/shop" className={buttonStyles({ size: "md" })}>
              Shop at trade prices
              <ArrowRight className="size-3.5" />
            </Link>
            <a
              href={`mailto:${settings.b2bEmail}`}
              className="link-underline text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-ink-soft"
            >
              Request an account change
            </a>
          </div>
        </section>
      ) : null}

      {pending && business ? (
        <section className="border border-line bg-cream p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-serif text-2xl font-light">
              <Clock3 className="size-4 text-clay" strokeWidth={1.5} />
              Submitted for review
            </h3>
            <Badge tone="clay">Pending</Badge>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">
                Legal name
              </dt>
              <dd className="mt-1">{business.legal_name}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">GSTIN</dt>
              <dd className="mt-1 tracking-[0.08em]">{business.gstin}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">
                Submitted
              </dt>
              <dd className="mt-1">{formatDate(business.submitted_at)}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">
                Next step
              </dt>
              <dd className="mt-1">Manual GSTIN review</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            We will email {user.email} once a decision is made. If your details need changing,
            write to{" "}
            <a href={`mailto:${settings.b2bEmail}`} className="link-underline text-ink-soft">
              {settings.b2bEmail}
            </a>
            .
          </p>
        </section>
      ) : null}

      {!approved && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="border border-line bg-cream p-5 sm:p-7">
            {rejected ? (
              <div className="mb-8 border border-red-900/20 bg-red-900/5 p-4">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-red-900">
                  Application needs attention
                </p>
                <p className="mt-2 text-sm leading-relaxed text-red-900">
                  {business?.admin_note ??
                    "We could not verify the GST details submitted. Check them carefully and apply again."}
                </p>
              </div>
            ) : null}
            <BusinessForm
              business={business}
              accountEmail={user.email ?? ""}
              accountPhone={viewer.profile?.phone ?? ""}
            />
          </section>

          <aside className="space-y-5">
            <div className="border border-line bg-cream p-5">
              <h3 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                What trade unlocks
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li className="flex gap-2.5">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-clay" strokeWidth={1.5} />
                  Wholesale prices on approved styles
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck
                    className="mt-0.5 size-3.5 shrink-0 text-clay"
                    strokeWidth={1.5}
                  />
                  Per-product minimums for wholesale buying
                </li>
                <li className="flex gap-2.5">
                  <BadgeCheck
                    className="mt-0.5 size-3.5 shrink-0 text-clay"
                    strokeWidth={1.5}
                  />
                  GST invoices with your registered details
                </li>
              </ul>
            </div>
            <div className="border border-line bg-cream p-5">
              <h3 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                How approval works
              </h3>
              <ol className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                <li>
                  <span className="text-ink">01</span> Submit your GSTIN and registered address.
                </li>
                <li>
                  <span className="text-ink">02</span> We verify the details manually, usually
                  within two working days.
                </li>
                <li>
                  <span className="text-ink">03</span> Wholesale pricing switches on for your
                  account.
                </li>
              </ol>
            </div>
            <p className="px-1 text-xs leading-relaxed text-muted">
              Questions about larger runs or custom work?{" "}
              <a
                href={`mailto:${settings.b2bEmail}`}
                className="link-underline text-ink-soft"
              >
                {settings.b2bEmail}
              </a>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
