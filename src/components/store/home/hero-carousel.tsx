"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collection"
      className="relative isolate overflow-hidden bg-gradient-to-br from-paper via-blush/35 to-butter/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-lilac/35 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 size-96 rounded-full bg-butter/60 blur-3xl"
      />

      <div className="editorial-container relative grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="order-1 max-w-xl">
          <div
            key={`${slide.id}-content`}
            className={cn(
              "animate-fade-up",
              slide.align === "center" && "text-center",
              slide.align === "right" && "ml-auto text-right",
            )}
          >
            <p
              className={cn(
                "eyebrow flex items-center gap-3 text-clay",
                slide.align === "center" && "justify-center",
                slide.align === "right" && "justify-end",
              )}
            >
              <Sparkles className="size-3.5" strokeWidth={1.5} />
              {slide.eyebrow}
            </p>
            <h1 className="mt-5 font-serif text-[clamp(2.6rem,5.4vw,4.6rem)] font-light leading-[0.98] tracking-[-0.045em] text-balance text-ink">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-[0.98rem]">
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
                className={buttonStyles({ size: "lg" })}
              >
                {slide.cta_label || "Shop the collection"}
                <ArrowRight className="size-4" />
              </Link>
              {slide.secondary_cta_label ? (
                <Link
                  href={slide.secondary_cta_href || "/about"}
                  className="link-underline inline-flex items-center gap-2 px-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
                >
                  {slide.secondary_cta_label}
                </Link>
              ) : null}
            </div>
          </div>

          <p className="script-label mt-8 text-2xl text-clay/85">
            Har dhaage mein apnapan
          </p>

          <div className="mt-6 flex items-center gap-4 border-t border-ink/10 pt-5">
            <div className="flex items-center gap-2">
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
                      "block h-0.5 rounded-full transition-all duration-500",
                      index === active
                        ? "w-10 bg-clay"
                        : "w-5 bg-ink/20 group-hover:bg-ink/45",
                    )}
                  />
                </button>
              ))}
              <span className="ml-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
            </div>

            {slides.length > 1 ? (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(active - 1)}
                  aria-label="Previous slide"
                  className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 bg-cream/60 text-ink transition-colors hover:border-clay hover:bg-clay hover:text-cream"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(active + 1)}
                  aria-label="Next slide"
                  className="inline-flex size-9 items-center justify-center rounded-full border border-ink/15 bg-cream/60 text-ink transition-colors hover:border-clay hover:bg-clay hover:text-cream"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative order-2 mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-[11rem_11rem_2rem_2rem] border border-dashed border-clay/25"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[10rem_10rem_1.5rem_1.5rem] bg-sand shadow-soft sm:aspect-[5/6] lg:aspect-[4/5]">
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
                    sizes="(min-width: 1024px) 44vw, 90vw"
                    className="object-cover"
                    fallbackClassName="bg-blush"
                  />
                )}
              </div>
            ))}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/25 to-transparent"
            />
            <span className="absolute bottom-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-cream/90 px-3 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-ink-soft backdrop-blur-sm">
              <span aria-hidden className="size-1 rounded-full bg-clay" />
              Handmade · Varanasi
            </span>
          </div>

          <span className="script-label absolute -left-2 top-8 rotate-[-7deg] rounded-full bg-cream/95 px-4 py-1.5 text-lg text-clay shadow-soft sm:-left-4">
            made with care
          </span>
        </div>
      </div>
    </section>
  );
}
