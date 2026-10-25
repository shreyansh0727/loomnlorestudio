import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BannerConfig } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BannerSection({ config }: { config: BannerConfig }) {
  return (
    <section className="py-10 lg:py-14">
      <div className="editorial-container">
        <div className="relative isolate min-h-[26rem] overflow-hidden rounded-[2rem] border border-line bg-sand lg:min-h-[32rem]">
          <SafeImage
            src={config.image_url}
            alt={config.heading}
            sizes="(min-width: 1024px) 90vw, 100vw"
            className="object-cover"
            fallbackClassName="bg-butter"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-paper/95 via-paper/80 to-paper/20 lg:via-paper/60 lg:to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-1/2 size-56 -translate-y-1/2 rounded-full border border-dashed border-clay/25"
          />

          <div className="relative flex min-h-[26rem] items-center px-6 py-14 sm:px-10 lg:min-h-[32rem] lg:px-14 lg:py-20">
            <div
              className={cn(
                "max-w-xl",
                config.align === "center" && "mx-auto text-center",
                config.align === "right" && "ml-auto text-right",
              )}
            >
              <p className="eyebrow text-clay">{config.eyebrow}</p>
              <h2 className="mt-4 font-serif text-[clamp(2.3rem,5vw,4rem)] font-light leading-[1.02] tracking-[-0.045em] text-balance text-ink">
                {config.heading}
              </h2>
              <p
                className={cn(
                  "mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base",
                  config.align === "center" && "mx-auto",
                  config.align === "right" && "ml-auto",
                )}
              >
                {config.body}
              </p>
              <div
                className={cn(
                  "mt-8 flex",
                  config.align === "center" && "justify-center",
                  config.align === "right" && "justify-end",
                )}
              >
                <Link
                  href={config.cta_href || "/shop"}
                  className={buttonStyles({ size: "lg" })}
                >
                  {config.cta_label || "Discover more"}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
