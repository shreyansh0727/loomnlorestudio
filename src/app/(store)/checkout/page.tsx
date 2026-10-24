import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { isRazorpayConfigured, isSupabaseConfigured } from "@/lib/env";
import type { CheckoutViewer } from "@/lib/checkout/types";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { Breadcrumbs } from "@/components/store/breadcrumbs";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your Loom & Lore order. Retail and trade checkout with secure Razorpay payment.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [viewer, settings] = await Promise.all([getViewer(), getSiteSettings()]);
  const business = viewer.isB2B ? viewer.business : null;

  const checkoutViewer: CheckoutViewer = {
    isB2B: viewer.isB2B,
    email: viewer.user?.email ?? null,
    fullName: viewer.profile?.full_name || business?.legal_name || "",
    phone: viewer.profile?.phone || business?.phone || "",
    business: business
      ? {
          legalName: business.legal_name,
          tradeName: business.trade_name,
          gstin: business.gstin,
          email: business.email,
          phone: business.phone,
          address: {
            full_name: business.legal_name,
            email: business.email,
            phone: business.phone,
            line1: business.address_line1,
            line2: business.address_line2,
            city: business.city,
            state: business.state,
            pincode: business.pincode,
            country: "India",
          },
        }
      : null,
  };

  const paymentsReady =
    isSupabaseConfigured &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    isRazorpayConfigured;

  return (
    <>
      <section className="border-b border-line">
        <div className="editorial-container py-9 lg:py-12">
          <Breadcrumbs
            items={[{ label: "Your bag", href: "/cart" }, { label: "Checkout" }]}
          />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="display-title text-[clamp(2.6rem,5vw,4rem)]">Checkout</h1>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Products are paid now. Shipping is measured and quoted separately before
              dispatch. Every price includes GST.
            </p>
          </div>
        </div>
      </section>
      <CheckoutView
        viewer={checkoutViewer}
        settings={{
          gstRate: settings.gstRate,
          brandName: settings.brandName,
          supportEmail: settings.supportEmail,
          shippingPolicy: settings.shippingPolicy,
          returnsPolicy: settings.returnsPolicy,
        }}
        paymentsReady={paymentsReady}
      />
    </>
  );
}
