import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import type { Category, SiteSettings } from "@/lib/types";
import { Wordmark } from "@/components/ui/wordmark";

export function SiteFooter({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: Category[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ink/10 bg-ink text-cream">
      <div className="editorial-container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Wordmark name={settings.brandName} className="text-[1.8rem] text-cream" />
            <p className="mt-5 font-serif text-xl font-light leading-snug text-cream/75">
              {settings.brandTagline}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-cream/55">
              Considered cloth, made in small batches with weaving and printing studios
              across India.
            </p>

            <address className="mt-7 space-y-2 not-italic text-sm text-cream/65">
              <a
                href={`mailto:${settings.supportEmail}`}
                className="flex items-center gap-2.5 transition-colors hover:text-cream"
              >
                <Mail className="size-3.5" strokeWidth={1.5} />
                {settings.supportEmail}
              </a>
              <a
                href={`tel:${settings.supportPhone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2.5 transition-colors hover:text-cream"
              >
                <Phone className="size-3.5" strokeWidth={1.5} />
                {settings.supportPhone}
              </a>
            </address>

            <div className="mt-7 flex flex-wrap gap-4 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream/55">
              {settings.instagramUrl ? (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  Instagram
                </a>
              ) : null}
              {settings.facebookUrl ? (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  Facebook
                </a>
              ) : null}
              {settings.pinterestUrl ? (
                <a
                  href={settings.pinterestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  Pinterest
                </a>
              ) : null}
            </div>
          </div>

          <FooterColumn title="Shop">
            {categories.map((category) => (
              <FooterLink key={category.id} href={`/shop?category=${category.slug}`}>
                {category.name}
              </FooterLink>
            ))}
            <FooterLink href="/shop">All pieces</FooterLink>
            <FooterLink href="/offers">Offers &amp; combos</FooterLink>
          </FooterColumn>

          <FooterColumn title="Help">
            <FooterLink href="/track">Track an order</FooterLink>
            <FooterLink href="/policies#shipping">Shipping</FooterLink>
            <FooterLink href="/policies#returns">Returns</FooterLink>
            <FooterLink href="/policies#terms">Terms &amp; privacy</FooterLink>
            <FooterLink href={`mailto:${settings.supportEmail}`}>Write to us</FooterLink>
          </FooterColumn>

          <FooterColumn title="The studio">
            <FooterLink href="/about">Our story</FooterLink>
            <FooterLink href="/business">Trade accounts</FooterLink>
            <FooterLink href="/account">Your account</FooterLink>
            <FooterLink href="/login">Sign in</FooterLink>
            <a
              href={`mailto:${settings.b2bEmail}`}
              className="inline-flex items-center gap-1.5 text-sm text-cream/65 transition-colors hover:text-cream"
            >
              {settings.b2bEmail}
              <ArrowUpRight className="size-3" />
            </a>
          </FooterColumn>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-cream/15 pt-6 text-[0.62rem] uppercase tracking-[0.14em] text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.sellerLegalName}. All rights reserved.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Made with care in India</span>
            {settings.sellerGstin ? (
              <>
                <span aria-hidden className="size-0.5 rounded-full bg-cream/30" />
                <span>GSTIN {settings.sellerGstin}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="eyebrow mb-5 text-cream/45">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="w-fit text-sm text-cream/65 transition-colors hover:text-cream"
    >
      {children}
    </Link>
  );
}
