import type { HomepageSection, Product } from "@/lib/types";
import { getRailProducts } from "@/lib/data/catalog";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";

type RailSection = Extract<HomepageSection, { section_type: "product_rail" }>;

const SOURCE_LABELS: Record<string, string> = {
  new_arrivals: "Just arrived",
  featured: "The edit",
  best_sellers: "Loved and reordered",
  category: "By the metre",
  manual: "Chosen by the studio",
};

export async function ProductRailSection({
  section,
  isB2B,
}: {
  section: RailSection;
  isB2B: boolean;
}) {
  const products: Product[] = await getRailProducts(section.config, 4);
  if (!products.length) return null;

  const category = products[0]?.category;
  const href =
    section.config.source === "category" && category
      ? `/shop?category=${category.slug}`
      : section.config.source === "new_arrivals"
        ? "/shop?sort=newest"
        : "/shop";

  return (
    <section className="py-14 lg:py-20">
      <div className="editorial-container">
        <SectionHeading
          eyebrow={SOURCE_LABELS[section.config.source] ?? "The collection"}
          title={section.title ?? "New & noteworthy"}
          description={section.subtitle ?? undefined}
          href={href}
          linkLabel="View all"
        />
        <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:mt-12 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isB2B={isB2B} />
          ))}
        </div>
      </div>
    </section>
  );
}
