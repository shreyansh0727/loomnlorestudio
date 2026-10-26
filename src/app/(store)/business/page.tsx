import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, FileText, PackageCheck } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Trade accounts",
    description: `Apply for a ${settings.brandName} trade account: wholesale pricing, per-product minimums and GST invoices for approved businesses.`,
  };
}

const STEPS = [
  {
    title: "Create a verified account",
    body: "Sign up with your business email and confirm it. Guest purchases are welcome, but trade terms need a verified account.",
  },
  {
    title: "Share your GST details",
    body: "Submit your legal name, GSTIN and registered address from your account. This is used on your GST invoice.",
  },
  {
    title: "Our team reviews",
    body: "We check the details by hand, usually within two working days. We may ask for a short note about your shop or studio.",
  },
  {
    title: "Trade pricing unlocks",
    body: "Once approved, wholesale rates and minimum-order quantities appear across the catalogue on your account.",
  },
];

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: "Wholesale rates",
    body: "Per-product trade pricing, shown only to approved accounts and locked at checkout.",
  },
  {
    icon: FileText,
    title: "GST invoices",
    body: "Every approved trade order receives a GST invoice with your business details and our seller GSTIN.",
  },
  {
    icon: PackageCheck,
    title: "Clear minimums",
    body: "Minimum order quantities are listed on every product, so you can plan a buy without guesswork.",
  },
];

export default async function BusinessPage() {
  const [viewer, settings] = await Promise.all([getViewer(), getSiteSettings()]);
  const ctaHref = viewer.user ? "/account/business" : "/signup?next=/account/business";
  const ctaLabel = viewer.isB2B
    ? "View your trade account"
    : viewer.user
      ? "Continue your application"
      : "Apply for a trade account";

  return (
    <>
      <section className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex items-center bg-cream px-6 py-16 sm:px-10 lg:py-24 xl:px-20">
          <div className="max-w-xl">
            <p className="eyebrow text-clay">For boutiques, gifting &amp; studios</p>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,6vw,5rem)] font-light leading-[0.98] tracking-[-0.045em]">
              Handmade,
              <br />
              by the dozen.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
              {settings.brandName} works with independent boutiques, gifting studios and
              online shops who want small-batch accessories with a real handmade finish.
              Approved trade accounts unlock wholesale rates, small minimums and GST
              invoicing.
            </p>

            {viewer.isB2B ? (
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Badge tone="sage">
                  <BadgeCheck className="size-3" /> Trade account approved
                </Badge>
                {viewer.business ? (
                  <span className="text-xs text-muted">{viewer.business.legal_name}</span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ctaHref} className={buttonStyles({ size: "lg" })}>
                {ctaLabel}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={`mailto:${settings.b2bEmail}`}
                className={buttonStyles({ size: "lg", variant: "secondary" })}
              >
                Write to the trade desk
              </Link>
            </div>

            <p className="mt-5 text-[0.62rem] uppercase tracking-[0.13em] text-muted">
              Manual GST verification · two working days · no application fee
            </p>
          </div>
        </div>

        <div className="relative min-h-[24rem] overflow-hidden bg-sand lg:min-h-[42rem]">
          <SafeImage
            src="/images/buniya/banner/wholesale-flatlay.jpg"
            alt="Handmade scrunchies, bows and clips laid out for wholesale"
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
          <div
            aria-hidden
            className="deep-surface absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent"
          />
          <div className="deep-surface absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-cream sm:left-8 sm:right-8">
            <p className="max-w-[16rem] font-serif text-xl font-light leading-snug">
              Little things, made to be sold beautifully.
            </p>
            <p className="text-[0.58rem] uppercase tracking-[0.16em] text-cream/75">
              Trade catalogue · 2026
            </p>
          </div>
        </div>
      </section>

      <section className="editorial-container py-16 lg:py-24">
        <SectionHeading
          eyebrow="Why trade with us"
          title="Terms that respect your margin"
          description="No hidden volume tiers or account fees. A clear wholesale price and minimum, agreed when your account is approved."
        />
        <div className="mt-10 grid gap-8 sm:grid-cols-3 lg:mt-14 lg:gap-12">
          {BENEFITS.map((benefit, index) => (
            <div key={benefit.title} className="border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <benefit.icon className="size-5 text-clay" strokeWidth={1.4} />
                <span className="font-serif text-sm italic text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 font-serif text-2xl font-light tracking-[-0.025em]">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-cream/60 py-16 lg:py-24">
        <div className="editorial-container">
          <SectionHeading
            eyebrow="How it works"
            title="From account to first order"
            description="A short, manual process. We keep it this way so the right people are looking at your business."
          />
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t border-line pt-6">
                <span className="font-serif text-[2.4rem] font-light leading-none text-clay/40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-xl font-light tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-3xl border border-line bg-cream p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <Building2 className="mt-0.5 size-5 shrink-0 text-clay" strokeWidth={1.4} />
              <div>
                <h3 className="font-serif text-2xl font-light tracking-[-0.02em]">
                  Ready to open a trade account?
                </h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                  Keep your GSTIN and registered address handy. The application takes a
                  few minutes, and you can keep shopping at retail prices while it is
                  reviewed.
                </p>
              </div>
            </div>
            <Link
              href={ctaHref}
              className={buttonStyles({ size: "md", className: "shrink-0" })}
            >
              {ctaLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="editorial-container py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="eyebrow text-clay">Good to know</p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.05] tracking-[-0.035em]">
              The fine print, plainly.
            </h2>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {[
              {
                term: "Minimum quantities",
                detail:
                  "Each product lists its wholesale minimum. Your cart enforces the minimum for each line and we will confirm availability before dispatch.",
              },
              {
                term: "Pricing & GST",
                detail:
                  "Wholesale prices are tax-inclusive. Approved business orders receive a GST invoice showing our GSTIN and your registered business details.",
              },
              {
                term: "Shipping",
                detail:
                  "Product payment is collected online. Exact shipping is quoted manually and paid through a secure Razorpay link before dispatch.",
              },
              {
                term: "Returns",
                detail:
                  "Made-to-order and customised pieces are final sale. Ready-made wholesale returns are agreed with the trade desk before shipping back; see the returns policy for details.",
              },
              {
                term: "Privacy",
                detail: `Your GST details are used for invoice and compliance purposes only, and are not shown publicly. Questions can go to ${settings.b2bEmail}.`,
              },
            ].map((item) => (
              <div key={item.term} className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  {item.term}
                </dt>
                <dd className="text-sm leading-relaxed text-muted">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
