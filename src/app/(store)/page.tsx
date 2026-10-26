import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getHomepageSections, getSiteSettings } from "@/lib/data/content";
import { getCategories } from "@/lib/data/catalog";
import { getViewer } from "@/lib/auth";
import { HomepageSections } from "@/components/store/home/homepage-sections";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonStyles } from "@/components/ui/button";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = "Handmade scrunchies, bows & hair accessories";
  const description = `Shop handmade satin scrunchies, hair bows, fashion ties and crochet accessories from ${settings.brandName}, Varanasi. Retail and approved wholesale accounts.`;

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      locale: "en_IN",
      url: "/",
      title: `${settings.brandName} — ${title}`,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.brandName} — ${title}`,
      description,
      images: [DEFAULT_SOCIAL_IMAGE.url],
    },
  };
}

export default async function HomePage() {
  const [sections, categories, viewer, settings] = await Promise.all([
    getHomepageSections(),
    getCategories(),
    getViewer(),
    getSiteSettings(),
  ]);

  if (!sections.length) {
    return (
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-paper via-blush/35 to-butter/40">
        <div className="editorial-container grid gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:py-24">
          <div className="max-w-xl">
            <p className="eyebrow flex items-center gap-3 text-clay">
              {settings.brandTagline}
            </p>
            <h1 className="mt-5 font-serif text-[clamp(2.6rem,5.4vw,4.6rem)] font-light leading-[0.98] tracking-[-0.045em]">
              Little things, made lovely.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
              Our first little collection is being tied with ribbon. In the meantime,
              read our story or start a wholesale conversation with the workroom.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className={buttonStyles({ size: "lg" })}>
                Our story
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/business"
                className="link-underline inline-flex items-center gap-2 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft hover:text-ink"
              >
                Trade enquiries
              </Link>
            </div>
            <p className="script-label mt-8 text-2xl text-clay/85">
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
                src="/images/buniya/hero/ribbon-table.jpg"
                alt="Handmade satin scrunchies and bows"
                priority
                sizes="(min-width: 1024px) 44vw, 90vw"
                className="object-cover"
                fallbackClassName="bg-blush"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return <HomepageSections sections={sections} categories={categories} isB2B={viewer.isB2B} />;
}
