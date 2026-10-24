import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, PackageSearch, ReceiptText, ShieldCheck } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { TrackOrderForm } from "@/components/orders/track-order-form";
import { Breadcrumbs } from "@/components/store/breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Track an order",
    description: `Follow your ${settings.brandName} order with your order number and the email used at checkout.`,
  };
}

export default async function TrackPage() {
  const [settings, viewer] = await Promise.all([getSiteSettings(), getViewer()]);

  return (
    <div className="editorial-container py-10 lg:py-16">
      <Breadcrumbs items={[{ label: "Track an order" }]} />

      <div className="mt-7 grid overflow-hidden border border-line bg-cream lg:grid-cols-[1.04fr_0.96fr]">
        <div className="px-5 py-10 sm:px-10 lg:px-14 lg:py-16">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow text-clay">Order care</p>
            <h1 className="mt-4 font-serif text-[clamp(2.5rem,4.5vw,3.8rem)] font-light leading-[1.01] tracking-[-0.045em]">
              Follow your cloth home.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Enter your order number and the email you used at checkout to see every
              update, from the studio to your door.
            </p>

            <div className="mt-8">
              <TrackOrderForm />
            </div>

            <div className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-muted">
              {viewer.user ? (
                <p>
                  Signed in as {viewer.user.email}.{" "}
                  <Link href="/account/orders" className="link-underline font-semibold text-ink">
                    See all your orders
                  </Link>
                </p>
              ) : (
                <p>
                  Have an account?{" "}
                  <Link href="/login?next=/account/orders" className="link-underline font-semibold text-ink">
                    Sign in
                  </Link>{" "}
                  to see every order in one place. Guest orders can be tracked here at any
                  time.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="relative flex flex-col justify-between bg-ink px-6 py-10 text-cream sm:px-10 lg:px-12 lg:py-14">
          <div>
            <p className="eyebrow text-cream/45">Where to look</p>
            <h2 className="mt-4 max-w-sm font-serif text-[1.9rem] font-light leading-[1.12] tracking-[-0.025em]">
              Two small details unlock the whole journey.
            </h2>

            <dl className="mt-9 space-y-6 border-t border-cream/15 pt-7">
              <div className="flex gap-4">
                <ReceiptText className="mt-0.5 size-4 shrink-0 text-cream/50" strokeWidth={1.5} />
                <div>
                  <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-cream/55">
                    Your order number
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-cream/75">
                    Shown on your confirmation email and begins with LL-, followed by the
                    date and a short sequence.
                  </dd>
                </div>
              </div>
              <div className="flex gap-4">
                <PackageSearch className="mt-0.5 size-4 shrink-0 text-cream/50" strokeWidth={1.5} />
                <div>
                  <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-cream/55">
                    The email you ordered with
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-cream/75">
                    Even if you created an account later, use the address that was on the
                    original order.
                  </dd>
                </div>
              </div>
              <div className="flex gap-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cream/50" strokeWidth={1.5} />
                <div>
                  <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-cream/55">
                    A private link
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-cream/75">
                    Once found, your order opens on its own private page. Keep that link if
                    you want to return to it later.
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-10 border-t border-cream/15 pt-6">
            <p className="text-sm leading-relaxed text-cream/65">
              Lost your order number or changed email since ordering? The studio can help.
            </p>
            <a
              href={`mailto:${settings.supportEmail}?subject=${encodeURIComponent("Order help")}`}
              className="mt-3 inline-flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-cream underline-offset-4 hover:underline"
            >
              <Mail className="size-3.5" />
              {settings.supportEmail}
            </a>
            <Link
              href="/policies#shipping"
              className="mt-5 flex items-center justify-between border-t border-cream/15 pt-4 text-[0.62rem] uppercase tracking-[0.14em] text-cream/50 transition-colors hover:text-cream"
            >
              Read the shipping policy
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
