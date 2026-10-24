"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HeroSlide } from "@/lib/types";
import { buttonStyles } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 7500;

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (!slides.length) return;
      setActive((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || reducedMotion || slides.length < 2) return;
    timer.current = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, reducedMotion, slides.length]);

  if (!slides.length) return null;
  const slide = slides[active];
  const light = slide.tone === "light";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collection"
      className="relative isolate h-[clamp(34rem,84svh,54rem)] w-full overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((item, index) => (
        <div
          key={item.id}
          aria-hidden={index !== active}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1100ms] ease-out",
            index === active ? "opacity-100" : "opacity-0",
          )}
        >
          {item.media_type === "video" && item.video_url ? (
            <video
              className="size-full object-cover"
              src={item.video_url}
              poster={item.poster_url || item.image_url}
              autoPlay
              muted
              loop
              playsInline
              preload={index === active ? "auto" : "none"}
            />
          ) : (
            <SafeImage
              src={item.image_url}
              alt={item.title}
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
              fallbackClassName="bg-[#5b564c]"
            />
          )}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0",
              light
                ? "bg-gradient-to-r from-ink/75 via-ink/40 to-ink/5"
                : "bg-gradient-to-r from-paper/85 via-paper/55 to-paper/15",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "absolute inset-x-0 bottom-0 h-40",
              light
                ? "bg-gradient-to-t from-ink/45 to-transparent"
                : "bg-gradient-to-t from-paper/40 to-transparent",
            )}
          />
        </div>
      ))}

      <div className="editorial-container relative flex h-full flex-col justify-end pb-20 pt-24 sm:pb-24 lg:pb-28">
        <div
          key={`${slide.id}-content`}
          className={cn(
            "max-w-3xl animate-fade-up",
            slide.align === "center" && "mx-auto text-center",
            slide.align === "right" && "ml-auto text-right",
            light ? "text-cream" : "text-ink",
          )}
        >
          <p
            className={cn(
              "eyebrow",
              light ? "text-cream/75" : "text-clay",
            )}
          >
            {slide.eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(2.8rem,7vw,6.25rem)] font-light leading-[0.95] tracking-[-0.045em] text-balance">
            {slide.title}
          </h1>
          <p
            className={cn(
              "mt-5 max-w-lg text-sm leading-relaxed sm:text-base",
              slide.align === "center" && "mx-auto",
              slide.align === "right" && "ml-auto",
              light ? "text-cream/75" : "text-ink-soft",
            )}
          >
            {slide.subtitle}
          </p>
          <div
            className={cn(
              "mt-8 flex flex-wrap items-center gap-3",
              slide.align === "center" && "justify-center",
              slide.align === "right" && "justify-end",
            )}
          >
            <Link
              href={slide.cta_href || "/shop"}
              className={buttonStyles({
                size: "lg",
                variant: light ? "inverse" : "primary",
              })}
            >
              {slide.cta_label || "Explore the collection"}
              <ArrowRight className="size-4" />
            </Link>
            {slide.secondary_cta_label ? (
              <Link
                href={slide.secondary_cta_href || "/about"}
                className={cn(
                  "link-underline inline-flex items-center gap-2 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em]",
                  light ? "text-cream/85 hover:text-cream" : "text-ink-soft hover:text-ink",
                )}
              >
                {slide.secondary_cta_label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="editorial-container flex items-center justify-between gap-6 pb-6">
          <div className="flex items-center gap-3">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to slide ${index + 1}: ${item.title}`}
                aria-current={index === active ? "true" : undefined}
                className="group flex items-center py-2"
              >
                <span
                  className={cn(
                    "block h-px transition-all duration-500",
                    index === active
                      ? light
                        ? "w-14 bg-cream"
                        : "w-14 bg-ink"
                      : light
                        ? "w-7 bg-cream/35 group-hover:bg-cream/70"
                        : "w-7 bg-ink/25 group-hover:bg-ink/60",
                  )}
                />
              </button>
            ))}
            <span
              className={cn(
                "ml-1 text-[0.6rem] font-medium uppercase tracking-[0.18em]",
                light ? "text-cream/55" : "text-ink/50",
              )}
            >
              {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>

          {slides.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous slide"
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border transition-colors",
                  light
                    ? "border-cream/30 text-cream hover:bg-cream hover:text-ink"
                    : "border-ink/20 text-ink hover:bg-ink hover:text-cream",
                )}
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next slide"
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full border transition-colors",
                  light
                    ? "border-cream/30 text-cream hover:bg-cream hover:text-ink"
                    : "border-ink/20 text-ink hover:bg-ink hover:text-cream",
                )}
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
