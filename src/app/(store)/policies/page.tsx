import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data/content";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { formatGstin } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Policies",
    description: `Shipping, returns, terms and privacy for ${settings.brandName} orders and trade accounts.`,
  };
}

const SECTIONS = [
  { id: "shipping", label: "Shipping" },
  { id: "returns", label: "Returns" },
  { id: "terms", label: "Terms" },
  { id: "privacy", label: "Privacy" },
  { id: "seller", label: "Seller details" },
];

export default async function PoliciesPage() {
  const settings = await getSiteSettings();
  const address = settings.sellerAddress;

  return (
    <div className="editorial-container py-10 lg:py-16">
      <Breadcrumbs items={[{ label: "Policies" }]} />

      <div className="mt-7 max-w-3xl">
        <p className="eyebrow text-clay">The details</p>
        <h1 className="display-title mt-4 text-[clamp(2.6rem,5.5vw,4.6rem)]">
          Policies, plainly written.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          How your order is packed, charged, shipped and — if needed — returned. If
          anything here is unclear, write to{" "}
          <a
            href={`mailto:${settings.supportEmail}`}
            className="link-underline text-ink"
          >
            {settings.supportEmail}
          </a>{" "}
          and a person will answer.
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-20">
        <nav aria-label="Policy sections" className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-4 text-muted">On this page</p>
          <ul className="space-y-2.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-ink-soft transition-colors hover:text-clay"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 border-t border-line pt-5 text-sm leading-relaxed text-muted">
            <p>Workroom hours</p>
            <p className="mt-1 text-ink-soft">Mon–Sat · 10am–6pm IST</p>
            <p className="mt-3">
              <a href={`tel:${settings.supportPhone.replace(/[^\d+]/g, "")}`} className="hover:text-ink">
                {settings.supportPhone}
              </a>
            </p>
          </div>
        </nav>

        <div className="space-y-14">
          <section id="shipping" className="scroll-mt-28">
            <h2 className="font-serif text-3xl font-light tracking-[-0.03em]">Shipping</h2>
            <div className="prose-editorial mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {settings.shippingPolicy.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <p>
                Product payment is collected online at checkout. Shipping is arranged
                manually because parcel weight and destination vary. Once your order is
                confirmed, we email a secure Razorpay payment link for the exact shipping
                charge. Dispatch happens only after the shipping charge is paid.
              </p>
              <p>
                Tracking details are added to your order page and emailed the moment your
                parcel leaves our workroom. For trade orders, bulk courier arrangements are
                confirmed with your trade contact.
              </p>
            </div>
          </section>

          <section id="returns" className="scroll-mt-28 border-t border-line pt-10">
            <h2 className="font-serif text-3xl font-light tracking-[-0.03em]">Returns</h2>
            <div className="prose-editorial mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {settings.returnsPolicy.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <p>
                To begin a return, email{" "}
                <a href={`mailto:${settings.supportEmail}`} className="link-underline text-ink">
                  {settings.supportEmail}
                </a>{" "}
                with your order number and reason within the return window. Please do not
                send a parcel before we confirm the return address.
              </p>
            </div>
          </section>

          <section id="terms" className="scroll-mt-28 border-t border-line pt-10">
            <h2 className="font-serif text-3xl font-light tracking-[-0.03em]">
              Terms of sale
            </h2>
            <div className="prose-editorial mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              <p>
                By placing an order you confirm the delivery details you provided are
                accurate and that you are authorised to use the selected payment method.
                Orders are accepted when payment is received and we confirm availability.
                If stock cannot be fulfilled after payment, the order moves to manual review
                and we will contact you to arrange a replacement, partial fulfilment or
                refund.
              </p>
              <p>
                All retail prices are inclusive of GST. Approved B2B orders receive a GST
                invoice based on the details in your approved trade profile. Retail orders
                receive a retail invoice. Prices, minimums and offers can change without
                notice; the price shown at checkout is the price applied to your order.
              </p>
              <p>
                Retail orders are limited to ten units per product. This limit does not
                apply to approved trade accounts, where per-product wholesale minimums
                apply instead.
              </p>
              <p>
                Handmade pieces can vary slightly in stitch, tone and finish. These
                variations are part of the making and are not considered defects. Custom
                and made-to-order pieces are final sale.
              </p>
            </div>
          </section>

          <section id="privacy" className="scroll-mt-28 border-t border-line pt-10">
            <h2 className="font-serif text-3xl font-light tracking-[-0.03em]">Privacy</h2>
            <div className="prose-editorial mt-5 max-w-2xl text-sm leading-relaxed text-ink-soft">
              <p>
                We collect the name, email, phone, delivery address and business details
                needed to process your order. Payment card information is handled directly
                by Razorpay and is never stored by us.
              </p>
              <p>
                Order confirmation and status emails are sent through Resend. Guest orders
                are accessible through an unguessable secure link sent to the email used at
                checkout. If you create an account with the same verified email, existing
                purchases made with that email are linked to your account.
              </p>
              <p>
                We do not sell customer or business data. GST details are used for invoice
                and compliance purposes. To request a copy, correction or deletion of your
                personal data, write to{" "}
                <a href={`mailto:${settings.supportEmail}`} className="link-underline text-ink">
                  {settings.supportEmail}
                </a>
                .
              </p>
            </div>
          </section>

          <section id="seller" className="scroll-mt-28 border-t border-line pt-10">
            <h2 className="font-serif text-3xl font-light tracking-[-0.03em]">
              Seller details
            </h2>
            <address className="mt-5 grid gap-x-12 gap-y-4 text-sm not-italic leading-relaxed text-ink-soft sm:grid-cols-2">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Legal name</p>
                <p className="mt-1">{settings.sellerLegalName}</p>
                <p className="mt-3 text-[0.6rem] uppercase tracking-[0.14em] text-muted">GSTIN</p>
                <p className="mt-1">{formatGstin(settings.sellerGstin)}</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Registered address</p>
                <p className="mt-1">
                  {address.line1}
                  {address.line2 ? (
                    <>
                      <br />
                      {address.line2}
                    </>
                  ) : null}
                  <br />
                  {address.city}, {address.state} {address.pincode}
                  <br />
                  {address.country}
                </p>
              </div>
            </address>
            <p className="mt-6 text-sm text-muted">
              Questions?{" "}
              <a href={`mailto:${settings.supportEmail}`} className="link-underline text-ink">
                {settings.supportEmail}
              </a>{" "}
              ·{" "}
              <Link href="/business" className="link-underline text-ink">
                Trade desk
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
