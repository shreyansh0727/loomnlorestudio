import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Leaf, Scissors, Sun, Users } from "lucide-react";
import { getSiteSettings } from "@/lib/data/content";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonStyles } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Our story",
    description: `${settings.brandName} works directly with weavers, printers and family-run studios across India to make textiles that last.`,
  };
}

const VALUES = [
  {
    icon: Leaf,
    title: "Fibres with a trace",
    body: "Kala cotton, khadi, linen and silk blends chosen for how they feel, how they age and where they come from.",
  },
  {
    icon: Users,
    title: "Made with people we know",
    body: "Small runs commissioned directly from weaving clusters, block printers and tailoring units. Named makers wherever possible.",
  },
  {
    icon: Sun,
    title: "Colour from the earth",
    body: "Natural indigo, madder, iron and clay. We favour dyes and finishes that soften honestly rather than shine forever.",
  },
  {
    icon: Scissors,
    title: "Designed for use",
    body: "No single-season drops. We make useful lengths and pieces intended to be worn, washed, mended and kept.",
  },
];

export default async function AboutPage() {
  const [settings, viewer] = await Promise.all([getSiteSettings(), getViewer()]);

  return (
    <>
      <section className="relative isolate min-h-[30rem] overflow-hidden bg-ink lg:min-h-[38rem]">
        <SafeImage
          src="/images/editorial/atelier.jpg"
          alt="Inside a weaving studio"
          priority
          sizes="100vw"
          className="object-cover"
          fallbackClassName="bg-[#5b564c]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/10" />
        <div className="editorial-container relative flex min-h-[30rem] items-end py-16 text-cream lg:min-h-[38rem] lg:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow text-cream/65">The studio</p>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.95] tracking-[-0.045em]">
              Cloth with a
              <br />
              longer memory.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/70 sm:text-base">
              A small textile house in Bengaluru, working with makers across India to put
              good cloth back into everyday life.
            </p>
          </div>
        </div>
      </section>

      <section className="editorial-container py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-clay">Why we began</p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.3rem)] font-light leading-[1.05] tracking-[-0.035em]">
              Good cloth was getting harder to find. The people making it were getting
              harder to see.
            </h2>
          </div>
          <div className="prose-editorial max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
            {settings.aboutText.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <p>
              We keep the range small on purpose. Every length is chosen, cut and packed
              by the same team you write to. If something is not right, we want to hear
              about it directly.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-line pt-6 not-prose">
              <div>
                <p className="font-serif text-2xl font-light">2026</p>
                <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                  Studio founded
                </p>
              </div>
              <div className="h-8 w-px bg-line" aria-hidden />
              <div>
                <p className="font-serif text-2xl font-light">Bengaluru</p>
                <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                  Cut, packed, dispatched
                </p>
              </div>
              <div className="h-8 w-px bg-line" aria-hidden />
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                {settings.sellerLegalName}
                {settings.sellerGstin ? ` · GSTIN ${settings.sellerGstin}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-cream/60 py-16 lg:py-24">
        <div className="editorial-container">
          <SectionHeading
            eyebrow="What we hold to"
            title="Four quiet rules"
            description="Not a manifesto. Just the things we keep returning to when a decision is hard."
          />
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {VALUES.map((value, index) => (
              <div key={value.title} className="border-t border-line pt-6">
                <div className="flex items-center justify-between">
                  <value.icon className="size-5 text-clay" strokeWidth={1.4} />
                  <span className="font-serif text-sm italic text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-xl font-light tracking-[-0.02em]">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-container grid gap-4 py-16 sm:grid-cols-2 lg:gap-6 lg:py-24">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          <SafeImage
            src="/images/editorial/weaving-detail.jpg"
            alt="Detail of a handloom warp"
            sizes="(min-width: 640px) 50vw, 100vw"
          />
        </div>
        <div className="flex flex-col justify-center border border-line bg-cream p-8 lg:p-14">
          <p className="eyebrow text-clay">In the studio</p>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.05] tracking-[-0.035em]">
            The loom is only the beginning.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            Warping, weaving, dyeing and finishing all change the hand of a cloth. We
            visit the work in progress, feel the samples, and refuse the ones that only
            look good in a photograph.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={buttonStyles({ size: "md" })}>
              Shop the collection
              <ArrowRight className="size-3.5" />
            </Link>
            {!viewer.isB2B ? (
              <Link href="/business" className={buttonStyles({ size: "md", variant: "secondary" })}>
                Trade enquiries
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
