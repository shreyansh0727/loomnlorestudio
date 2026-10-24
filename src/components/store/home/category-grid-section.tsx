import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { getCategoryCounts } from "@/lib/data/catalog";
import { pluralise } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeading } from "@/components/ui/section-heading";

export async function CategoryGridSection({
  title,
  subtitle,
  categories,
  categoryIds,
}: {
  title: string | null;
  subtitle: string | null;
  categories: Category[];
  categoryIds: string[];
}) {
  const counts = await getCategoryCounts();
  const selected = categoryIds.length
    ? categoryIds
        .map((id) => categories.find((category) => category.id === id))
        .filter((category): category is Category => Boolean(category))
    : categories;

  if (!selected.length) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="editorial-container">
        <SectionHeading
          eyebrow="The collection"
          title={title ?? "Begin with the material"}
          description={subtitle ?? undefined}
          href="/shop"
          linkLabel="Shop all"
        />

        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:mt-14 lg:grid-cols-4 lg:gap-x-6 lg:pb-12">
          {selected.map((category, index) => {
            const count = counts[category.id] ?? 0;
            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`group relative block overflow-hidden bg-sand ${
                  index % 2 === 1 ? "lg:mt-12" : ""
                } ${index === selected.length - 1 && selected.length % 2 === 1 ? "lg:mt-24" : ""}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <SafeImage
                    src={category.image_url}
                    alt={category.name}
                    sizes="(min-width: 1024px) 24vw, 50vw"
                    className="transition-transform duration-[1100ms] ease-out group-hover:scale-[1.045]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/5 transition-opacity duration-500 group-hover:from-ink/85"
                  />

                  <span className="absolute left-4 top-4 font-serif text-sm italic text-cream/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-4 text-cream sm:p-5">
                    <h3 className="font-serif text-[1.35rem] font-light leading-tight tracking-[-0.02em] sm:text-2xl">
                      {category.name}
                    </h3>
                    {category.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-cream/65">
                        {category.description}
                      </p>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between border-t border-cream/20 pt-3 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-cream/70">
                      <span>
                        {count} {pluralise(count, "piece")}
                      </span>
                      <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
