import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/brand-mark";
import { getSiteSettings } from "@/lib/data/content";

export default async function NotFound() {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-line">
        <div className="editorial-container flex h-20 items-center justify-between gap-6">
          <Link href="/" aria-label={`${settings.brandName} home`}>
            <BrandMark name={settings.brandName} logoUrl={settings.logoUrl} />
          </Link>
          <Link
            href="/shop"
            className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-clay-deep"
          >
            Shop the collection
          </Link>
        </div>
      </header>

      <main className="editorial-container flex flex-1 items-center py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow text-clay">404 · Not found</p>
          <h1 className="mt-4 font-serif text-[clamp(2.8rem,6vw,4.6rem)] font-light leading-[0.98] tracking-[-0.045em]">
            This thread ends here.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
            The page may have moved or the link may be incomplete. The collection,
            your account and order tracking are all a thread away.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonStyles()}>
              Return home
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link href="/shop" className={buttonStyles({ variant: "secondary" })}>
              Browse the shop
            </Link>
            <Link
              href="/track"
              className="px-2 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
            >
              Track an order
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
