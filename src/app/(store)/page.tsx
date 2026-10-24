import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getHomepageSections, getSiteSettings } from "@/lib/data/content";
import { getCategories } from "@/lib/data/catalog";
import { getViewer } from "@/lib/auth";
import { HomepageSections } from "@/components/store/home/homepage-sections";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cloth with a longer memory",
  description:
    "Shop small-batch fabrics by the metre, home textiles and everyday wear from Indian makers. Retail and approved wholesale accounts.",
};

export default async function HomePage() {
  const [sections, categories, viewer, settings] = await Promise.all([
    getHomepageSections(),
    getCategories(),
    getViewer(),
    getSiteSettings(),
  ]);

  if (!sections.length) {
    return (
      <section className="relative isolate min-h-[calc(100svh-9rem)] overflow-hidden bg-ink">
        <SafeImage
          src="/images/hero/hero-loom.jpg"
          alt=""
          priority
          sizes="100vw"
          className="object-cover"
          fallbackClassName="bg-[#57544c]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/10" />
        <div className="editorial-container relative flex min-h-[calc(100svh-9rem)] items-center py-24 text-cream">
          <div className="max-w-2xl">
            <p className="eyebrow text-cream/65">{settings.brandTagline}</p>
            <h1 className="mt-5 font-serif text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.95] tracking-[-0.045em]">
              The collection is being prepared.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/70 sm:text-base">
              Our first lengths of cloth are on the loom. In the meantime, read a little
              about how we work, or open a trade conversation with the studio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className={buttonStyles({ variant: "inverse", size: "lg" })}>
                Our story
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/business"
                className="link-underline inline-flex items-center gap-2 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-cream/80 hover:text-cream"
              >
                Trade enquiries
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return <HomepageSections sections={sections} categories={categories} isB2B={viewer.isB2B} />;
}
