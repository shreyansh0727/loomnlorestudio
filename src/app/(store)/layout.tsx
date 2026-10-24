import { CartProvider } from "@/components/cart/cart-provider";
import { OfferPopup } from "@/components/store/offer-popup";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { getSiteSettings, getActivePopupOffer } from "@/lib/data/content";
import { getCategories } from "@/lib/data/catalog";
import { isScheduleActive } from "@/lib/utils";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories, popup] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getActivePopupOffer(),
  ]);

  const activePopup =
    popup?.is_active && isScheduleActive(popup.starts_at, popup.ends_at) ? popup : null;

  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only z-[100] bg-cream px-4 py-3 text-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader settings={settings} categories={categories} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} categories={categories} />
      </div>
      {activePopup ? <OfferPopup offer={activePopup} /> : null}
    </CartProvider>
  );
}
