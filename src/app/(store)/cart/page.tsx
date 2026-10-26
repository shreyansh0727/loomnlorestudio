import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/content";
import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/store/breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Your bag",
    description: `Review the pieces in your ${settings.brandName} bag before checkout.`,
    robots: { index: false, follow: false },
  };
}

export default async function CartPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="border-b border-line">
        <div className="editorial-container py-9 lg:py-12">
          <Breadcrumbs items={[{ label: "Your bag" }]} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="display-title text-[clamp(2.6rem,5vw,4rem)]">Your bag</h1>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Take a moment with your choices. Retail shipping is fixed at checkout by
              delivery zone, and every price you see includes GST.
            </p>
          </div>
        </div>
      </section>
      <CartView gstRate={settings.gstRate} />
    </>
  );
}
