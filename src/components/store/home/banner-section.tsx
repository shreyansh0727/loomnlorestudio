import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BannerConfig } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BannerSection({ config }: { config: BannerConfig }) {
  const light = config.tone === "light";

  return (
    <section className="relative isolate min-h-[26rem] overflow-hidden bg-ink lg:min-h-[34rem]">
      <SafeImage
        src={config.image_url}
        alt={config.heading}
        sizes="100vw"
        className="object-cover"
        fallbackClassName="bg-[#484a40]"
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-0",
          light
            ? "bg-gradient-to-r from-ink/80 via-ink/50 to-ink/10"
            : "bg-gradient-to-r from-paper/90 via-paper/65 to-paper/20",
        )}
      />

      <div className="editorial-container relative flex min-h-[26rem] items-center py-16 lg:min-h-[34rem] lg:py-24">
        <div
          className={cn(
            "max-w-xl",
            config.align === "center" && "mx-auto text-center",
            config.align === "right" && "ml-auto text-right",
            light ? "text-cream" : "text-ink",
          )}
        >
          <p className={cn("eyebrow", light ? "text-cream/65" : "text-clay")}>
            {config.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-[clamp(2.4rem,5.5vw,4.5rem)] font-light leading-[0.98] tracking-[-0.045em] text-balance">
            {config.heading}
          </h2>
          <p
            className={cn(
              "mt-5 max-w-md text-sm leading-relaxed sm:text-base",
              config.align === "center" && "mx-auto",
              config.align === "right" && "ml-auto",
              light ? "text-cream/70" : "text-ink-soft",
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
              className={buttonStyles({
                variant: light ? "inverse" : "primary",
                size: "lg",
              })}
            >
              {config.cta_label || "Discover more"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
