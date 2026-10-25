"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import type { Category, OfferCard, SiteSettings } from "@/lib/types";
import { useCart } from "@/components/cart/cart-provider";
import { BrandMark } from "@/components/ui/brand-mark";
import { CopyCode } from "@/components/store/copy-code";
import { cn } from "@/lib/utils";

export interface HeaderViewer {
  isB2B: boolean;
  isAdmin: boolean;
  name: string | null;
  email: string | null;
}

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/offers", label: "Offers" },
  { href: "/business", label: "Trade" },
  { href: "/about", label: "Our story" },
];

export function HeaderShell({
  settings,
  categories,
  offers,
  viewer,
}: {
  settings: SiteSettings;
  categories: Category[];
  offers: OfferCard[];
  viewer: HeaderViewer;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [renderedPath, setRenderedPath] = useState(pathname);
  const searchInput = useRef<HTMLInputElement>(null);

  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    if (!mobileOpen && !searchOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => searchInput.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  const accountHref = viewer.email ? "/account" : "/login";
  const bagLabel = hydrated && itemCount > 0 ? `Bag, ${itemCount} items` : "Bag, empty";

  return (
    <>
      {settings.announcementActive && settings.announcementText ? (
        <div className="border-b border-line/70 bg-blush/70 text-ink">
          <div className="editorial-container flex min-h-9 items-center justify-center gap-3 py-2 text-center">
            <span aria-hidden className="hidden size-1 shrink-0 rounded-full bg-clay sm:block" />
            {settings.announcementHref ? (
              <Link
                href={settings.announcementHref}
                className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-ink/75 transition-colors hover:text-ink sm:text-[0.64rem]"
              >
                {settings.announcementText}
              </Link>
            ) : (
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-ink/75 sm:text-[0.64rem]">
                {settings.announcementText}
              </p>
            )}
            <span aria-hidden className="hidden size-1 shrink-0 rounded-full bg-clay sm:block" />
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="editorial-container">
          <div className="flex h-[4.4rem] items-center justify-between gap-4 lg:grid lg:h-[5rem] lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="-ml-2 inline-flex size-10 items-center justify-center text-ink transition-colors hover:text-clay lg:hidden"
              >
                <Menu className="size-5" strokeWidth={1.5} />
              </button>
              <Link href="/" aria-label={`${settings.brandName} home`} className="inline-flex">
                <BrandMark
                  name={settings.brandName}
                  subLabel="A Laxmi Collection Brand"
                  logoUrl={settings.logoUrl}
                  textClassName="text-[1.22rem] sm:text-[1.35rem] lg:text-[1.5rem]"
                  logoClassName="h-11 max-w-[9rem] mix-blend-multiply sm:h-14 sm:max-w-[11rem]"
                />
              </Link>
            </div>

            <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map((link) =>
                link.href === "/offers" ? (
                  <div key={link.href} className="group relative">
                    <Link
                      href={link.href}
                      className={cn(
                        "inline-flex items-center gap-1 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.17em] transition-colors",
                        pathname.startsWith(link.href) ? "text-clay" : "text-ink-soft hover:text-ink",
                      )}
                    >
                      {link.label}
                      <ChevronDown
                        className="size-3 transition-transform duration-200 group-hover:rotate-180"
                        strokeWidth={1.8}
                      />
                    </Link>
                    <div className="invisible absolute left-1/2 top-full w-[23rem] -translate-x-1/2 pt-4 opacity-0 transition-[opacity,visibility] duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <div className="rounded-2xl border border-line bg-cream p-5 shadow-lift">
                        <p className="eyebrow mb-4 text-clay">Today&apos;s little offers</p>
                        <div className="space-y-1">
                          {offers.length ? (
                            offers.map((offer) => (
                              <Link
                                key={offer.id}
                                href={offer.href}
                                className="group/item flex items-start justify-between gap-4 border-b border-line/60 py-3 last:border-0"
                              >
                                <span>
                                  <span className="block font-serif text-[1.05rem] leading-snug text-ink transition-colors group-hover/item:text-clay">
                                    {offer.title}
                                  </span>
                                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                                    {offer.meta ?? offer.description}
                                  </span>
                                </span>
                                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted transition-transform group-hover/item:translate-x-0.5" />
                              </Link>
                            ))
                          ) : (
                            <p className="py-2 text-sm text-muted">
                              A new offer is being prepared. Check back shortly.
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                          <Link
                            href="/offers"
                            className="link-underline text-[0.63rem] font-semibold uppercase tracking-[0.16em] text-ink"
                          >
                            All offers &amp; combos
                          </Link>
                          <span className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                            Applied at checkout
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "py-2 text-[0.66rem] font-semibold uppercase tracking-[0.17em] transition-colors",
                      pathname.startsWith(link.href) ? "text-clay" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              {viewer.isB2B ? (
                <span className="mr-2 hidden items-center gap-1.5 rounded-full bg-sage-light px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-sage md:inline-flex">
                  <span aria-hidden className="size-1 rounded-full bg-sage" />
                  Trade
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search the collection"
                className="inline-flex size-10 items-center justify-center text-ink transition-colors hover:text-clay"
              >
                <Search className="size-[1.15rem]" strokeWidth={1.5} />
              </button>
              <Link
                href={accountHref}
                aria-label={viewer.email ? "Your account" : "Sign in"}
                className="hidden size-10 items-center justify-center text-ink transition-colors hover:text-clay sm:inline-flex"
              >
                <UserRound className="size-[1.15rem]" strokeWidth={1.5} />
              </Link>
              <Link
                href="/cart"
                aria-label={bagLabel}
                className="relative inline-flex size-10 items-center justify-center text-ink transition-colors hover:text-clay"
              >
                <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} />
                {hydrated && itemCount > 0 ? (
                  <span className="absolute right-0.5 top-1 flex min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[0.55rem] font-bold leading-4 text-cream">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[90%] max-w-sm animate-fade-in flex-col overflow-y-auto rounded-r-3xl bg-cream shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <BrandMark
                name={settings.brandName}
                subLabel="A Laxmi Collection Brand"
                logoUrl={settings.logoUrl}
                textClassName="text-xl"
                logoClassName="h-10 max-w-[9rem] mix-blend-multiply"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex size-10 items-center justify-center text-ink"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-5 py-6">
              <p className="eyebrow mb-3 text-muted">Explore</p>
              <nav aria-label="Mobile" className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between border-b border-line/70 py-3.5 font-serif text-2xl font-light tracking-[-0.02em] text-ink"
                  >
                    {link.label}
                    <ArrowRight className="size-4 text-muted" />
                  </Link>
                ))}
              </nav>

              <p className="eyebrow mb-3 mt-8 text-muted">Shop by collection</p>
              <div className="flex flex-col gap-2.5">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-ink-soft transition-colors hover:text-clay"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              {offers.length ? (
                <>
                  <p className="eyebrow mb-3 mt-8 text-muted">Offers for you</p>
                  <div className="space-y-3">
                    {offers.slice(0, 3).map((offer) => (
                      <div key={offer.id} className="border border-line bg-paper/60 p-3.5">
                        <p className="font-serif text-lg leading-tight">{offer.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {offer.meta ?? offer.description}
                        </p>
                        {offer.code ? (
                          <CopyCode code={offer.code} className="mt-3" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="mt-8 border-t border-line pt-5">
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-ink-soft"
                >
                  <UserRound className="size-4" />
                  {viewer.email
                    ? viewer.name
                      ? `My account · ${viewer.name}`
                      : "My account"
                    : "Sign in or create an account"}
                </Link>
                {viewer.isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 flex items-center gap-2 text-sm text-clay"
                  >
                    Admin dashboard
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative mx-auto mt-[12vh] w-[92%] max-w-2xl animate-fade-up rounded-3xl border border-line bg-cream p-6 shadow-lift sm:p-8"
          >
            <div className="flex items-center justify-between">
              <p className="eyebrow text-clay">Search the collection</p>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="-mr-2 inline-flex size-9 items-center justify-center text-muted transition-colors hover:text-ink"
              >
                <X className="size-4.5" strokeWidth={1.5} />
              </button>
            </div>
            <form
              action="/shop"
              method="get"
              onSubmit={() => setSearchOpen(false)}
              className="mt-5"
            >
              <div className="flex items-end gap-3 border-b border-ink/30 pb-2">
                <Search className="mb-2 size-5 shrink-0 text-muted" strokeWidth={1.5} />
                <input
                  ref={searchInput}
                  type="search"
                  name="search"
                  placeholder="Scrunchies, bows, crochet…"
                  aria-label="Search products"
                  className="w-full bg-transparent py-2 font-serif text-2xl font-light tracking-[-0.02em] text-ink outline-none placeholder:text-muted/60 sm:text-3xl"
                />
                <button
                  type="submit"
                  className="mb-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-cream transition-colors hover:bg-clay-deep"
                  aria-label="Submit search"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.14em] text-muted">
              <span>Try</span>
              {["scrunchies", "bows", "pearls", "crochet"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push(`/shop?search=${term}`);
                  }}
                  className="rounded-full border border-line px-3 py-1.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
