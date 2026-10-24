import { Suspense } from "react";
import type { Category, HomepageSection } from "@/lib/types";
import { isScheduleActive } from "@/lib/utils";
import { HeroCarousel } from "@/components/store/home/hero-carousel";
import { OfferTicker } from "@/components/store/home/offer-ticker";
import { CategoryGridSection } from "@/components/store/home/category-grid-section";
import { ProductRailSection } from "@/components/store/home/product-rail-section";
import { EditorialSection } from "@/components/store/home/editorial-section";
import { BannerSection } from "@/components/store/home/banner-section";
import { ComboRailSection } from "@/components/store/home/combo-rail-section";

function RailSkeleton() {
  return (
    <section aria-hidden className="py-14 lg:py-20">
      <div className="editorial-container">
        <div className="h-2.5 w-20 animate-pulse bg-line/60" />
        <div className="mt-4 h-8 w-64 max-w-full animate-pulse bg-line/40" />
        <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:mt-12 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[4/5] w-full animate-pulse bg-line/30" />
              <div className="mt-4 h-2.5 w-3/4 animate-pulse bg-line/40" />
              <div className="mt-2 h-2.5 w-1/3 animate-pulse bg-line/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomepageSections({
  sections,
  categories,
  isB2B,
}: {
  sections: HomepageSection[];
  categories: Category[];
  isB2B: boolean;
}) {
  return (
    <>
      {sections
        .filter(
          (section) =>
            section.is_active &&
            isScheduleActive(section.starts_at, section.ends_at),
        )
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((section) => {
          switch (section.section_type) {
            case "hero":
              return <HeroCarousel key={section.id} slides={section.config.slides} />;
            case "offer_ticker":
              return <OfferTicker key={section.id} items={section.config.items} />;
            case "category_grid":
              return (
                <CategoryGridSection
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  categories={categories}
                  categoryIds={section.config.category_ids}
                />
              );
            case "product_rail":
              return (
                <Suspense key={section.id} fallback={<RailSkeleton />}>
                  <ProductRailSection section={section} isB2B={isB2B} />
                </Suspense>
              );
            case "editorial":
              return (
                <EditorialSection
                  key={section.id}
                  title={section.title}
                  config={section.config}
                />
              );
            case "banner":
              return <BannerSection key={section.id} config={section.config} />;
            case "combo_rail":
              return (
                <Suspense key={section.id} fallback={<RailSkeleton />}>
                  <ComboRailSection
                    title={section.title}
                    subtitle={section.subtitle}
                    limit={section.config.limit}
                    isB2B={isB2B}
                  />
                </Suspense>
              );
            default:
              return null;
          }
        })}
    </>
  );
}
