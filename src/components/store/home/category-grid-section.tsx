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
          eyebrow="Our little collections"
          title={title ?? "Find your little favourite"}
          description={subtitle ?? undefined}
          href="/shop"
          linkLabel="Shop all"
        />

        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:mt-14 lg:grid-cols-3 lg:gap-x-7 lg:pb-12">
          {selected.map((category, index) => {
            const count = counts[category.id] ?? 0;
            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`group block ${
                  index % 3 === 1 ? "lg:mt-12" : ""
                } ${index % 3 === 2 ? "lg:mt-24" : ""}`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[6.5rem] rounded-b-2xl border border-line bg-sand">
                  <SafeImage
                    src={category.image_url}
                    alt={category.name}
                    sizes="(min-width: 1024px) 30vw, 50vw"
                    className="transition-transform duration-[1100ms] ease-out group-hover:scale-[1.045]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90"
                  />
                  <span className="absolute left-4 top-4 inline-flex size-8 items-center justify-center rounded-full bg-cream/85 font-serif text-[0.7rem] italic text-clay backdrop-blur-sm">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="px-1 pt-4">
                  <h3 className="font-serif text-lg font-light leading-tight tracking-[-0.02em] text-ink sm:text-[1.35rem]">
                    {category.name}
                  </h3>
                  {category.description ? (
                    <p className="mt-1.5 line-clamp-2 text-[0.72rem] leading-relaxed text-muted sm:text-xs">
                      {category.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    <span>
                      {count} {pluralise(count, "little piece")}
                    </span>
                    <ArrowUpRight className="size-3.5 text-clay transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
