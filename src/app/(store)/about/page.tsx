import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Leaf, Scissors, Users } from "lucide-react";
import { getSiteSettings } from "@/lib/data/content";
import { SafeImage } from "@/components/ui/safe-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonStyles } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Our story",
    description: `${settings.brandName} is a Laxmi Collection brand making handmade scrunchies, bows and crochet accessories in Varanasi.`,
  };
}

const VALUES = [
  {
    icon: Scissors,
    title: "Handmade, start to finish",
    body: "Each scrunchie, bow and clip is cut, stitched and checked by our own small team. No piece leaves the workroom without a hand-finished detail.",
  },
  {
    icon: Heart,
    title: "Soft colours, careful finish",
    body: "Korean pastel palettes, low-sheen satin and gentle elastics. Pretty to look at, comfortable enough for a full day.",
  },
  {
    icon: Leaf,
    title: "Small batches, less waste",
    body: "We make in small runs and turn leftover fabric into scrunchies, clips and little gifts rather than letting it go to waste.",
  },
  {
    icon: Users,
    title: "For everyday & wholesale",
    body: "The same handmade quality for a single gift or a shop order. Retail customers and trade partners are looked after by the same team.",
  },
];

export default async function AboutPage() {
  const [settings, viewer] = await Promise.all([getSiteSettings(), getViewer()]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-paper via-blush/35 to-butter/40">
        <div className="editorial-container grid gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:py-24">
          <div className="max-w-xl">
            <p className="eyebrow text-clay">Our story</p>
            <h1 className="mt-4 font-serif text-[clamp(2.7rem,6vw,5rem)] font-light leading-[0.98] tracking-[-0.045em]">
              Made by hand,
              <br />
              made to be kept.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              Buniya is a Laxmi Collection brand from Varanasi, making soft little
              accessories for everyday hair days, weddings and everything in between.
            </p>
            <p className="script-label mt-7 text-2xl text-clay/85">
              Har dhaage mein apnapan
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-[11rem_11rem_2rem_2rem] border border-dashed border-clay/25"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[10rem_10rem_1.5rem_1.5rem] bg-sand shadow-soft">
              <SafeImage
                src="/images/buniya/editorial/atelier-hands.jpg"
                alt="Hands finishing satin bows in the Buniya workroom"
                priority
                sizes="(min-width: 1024px) 44vw, 90vw"
                className="object-cover"
              />
            </div>
            <p className="absolute bottom-4 left-4 rounded-full bg-cream/90 px-3.5 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-ink-soft backdrop-blur-sm">
              Varanasi workroom
            </p>
          </div>
        </div>
      </section>

      <section className="editorial-container py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-clay">Why we began</p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.3rem)] font-light leading-[1.05] tracking-[-0.035em]">
              A small workroom, a simple wish: make everyday things feel a little more
              special.
            </h2>
          </div>
          <div className="prose-editorial max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
            {settings.aboutText.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <p>
              We keep the collections small on purpose. Every piece is checked by the
              person who made it, packed by hand, and sent with a little care note. If
              something is not right, we want to hear about it directly.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-line pt-6 not-prose">
              <div>
                <p className="font-serif text-2xl font-light">2026</p>
                <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                  Buniya launched
                </p>
              </div>
              <div className="h-8 w-px bg-line" aria-hidden />
              <div>
                <p className="font-serif text-2xl font-light">Varanasi</p>
                <p className="mt-1 text-[0.58rem] uppercase tracking-[0.15em] text-muted">
                  Cut, stitched, dispatched
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
            title="Four little promises"
            description="Not a manifesto. Just the things we keep returning to when a decision is hard."
          />
          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {VALUES.map((value, index) => (
              <div
                key={value.title}
                className="rounded-3xl border border-line/80 bg-paper/60 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-blush/70 text-clay">
                    <value.icon className="size-5" strokeWidth={1.4} />
                  </span>
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
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand">
          <SafeImage
            src="/images/buniya/editorial/ribbon-detail.jpg"
            alt="Ribbon and pearl detail on a handmade bow"
            sizes="(min-width: 640px) 50vw, 100vw"
          />
        </div>
        <div className="flex flex-col justify-center rounded-[2rem] border border-line bg-cream p-8 lg:p-14">
          <p className="eyebrow text-clay">In the workroom</p>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.05] tracking-[-0.035em]">
            The last knot is tied by hand.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            Choosing the satin, cutting on the grain, setting each pearl, trimming the
            last thread — small steps that make a scrunchie feel considered. We work in
            daylight, in small batches, and only send pieces we would happily wear
            ourselves.
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
