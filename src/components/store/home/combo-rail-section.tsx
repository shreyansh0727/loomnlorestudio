import type { Combo } from "@/lib/types";
import { getPublicCombos } from "@/lib/data/promotions";
import { ComboCard } from "@/components/product/combo-card";
import { SectionHeading } from "@/components/ui/section-heading";

export async function ComboRailSection({
  title,
  subtitle,
  limit,
  isB2B,
}: {
  title: string | null;
  subtitle: string | null;
  limit: number;
  isB2B: boolean;
}) {
  const combos: Combo[] = await getPublicCombos({
    buyerType: isB2B ? "b2b" : "b2c",
    limit: limit || 3,
  });
  if (!combos.length) return null;

  return (
    <section className="py-16 lg:py-24">
      <div className="editorial-container">
        <SectionHeading
          eyebrow="Bundle & save"
          title={title ?? "Better together"}
          description={subtitle ?? undefined}
          href="/offers"
          linkLabel="All offers"
        />
        <div className="mt-9 grid gap-6 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} isB2B={isB2B} />
          ))}
        </div>
      </div>
    </section>
  );
}
