import type { Category, HomepageSection } from "@/lib/types";
import { isScheduleActive } from "@/lib/utils";
import { HeroCarousel } from "@/components/store/home/hero-carousel";
import { OfferTicker } from "@/components/store/home/offer-ticker";
import { CategoryGridSection } from "@/components/store/home/category-grid-section";
import { ProductRailSection } from "@/components/store/home/product-rail-section";
import { EditorialSection } from "@/components/store/home/editorial-section";
import { BannerSection } from "@/components/store/home/banner-section";
import { ComboRailSection } from "@/components/store/home/combo-rail-section";

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
                <ProductRailSection
                  key={section.id}
                  section={section}
                  isB2B={isB2B}
                />
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
                <ComboRailSection
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  limit={section.config.limit}
                  isB2B={isB2B}
                />
              );
            default:
              return null;
          }
        })}
    </>
  );
}
