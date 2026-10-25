import { getSiteSettings } from "@/lib/data/content";
import { BrandMark } from "@/components/ui/brand-mark";
import { SafeImage } from "@/components/ui/safe-image";

export async function AuthShell({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  quote,
  children,
  footer,
  notice,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  quote: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  notice?: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <div className="editorial-container py-10 lg:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-line bg-cream lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative hidden min-h-[44rem] lg:block">
          <SafeImage
            src={image}
            alt={imageAlt}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-clay-deep/75 via-ink/10 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-10 text-cream">
            <BrandMark
              name={settings.brandName}
              logoUrl={settings.logoUrl}
              textClassName="text-[1.05rem] text-cream"
              logoClassName="h-8 max-w-[9rem]"
              frameClassName="rounded-xl bg-cream px-2.5 py-1.5"
            />
            <p className="mt-4 max-w-md font-serif text-[1.9rem] font-light leading-[1.15] tracking-[-0.02em]">
              {quote}
            </p>
          </div>
        </div>

        <div className="flex items-center px-5 py-10 sm:px-10 lg:px-14 lg:py-16">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow text-clay">{eyebrow}</p>
            <h1 className="mt-4 font-serif text-[clamp(2.4rem,4vw,3.4rem)] font-light leading-[1.02] tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">{description}</p>
            {notice ? <div className="mt-6">{notice}</div> : null}
            <div className="mt-8">{children}</div>
            {footer ? (
              <div className="mt-8 border-t border-line pt-6 text-sm text-muted">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
