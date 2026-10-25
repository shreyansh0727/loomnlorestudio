"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { PopupOffer } from "@/lib/types";
import { isScheduleActive } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { CopyCode } from "@/components/store/copy-code";
import { buttonStyles } from "@/components/ui/button";

function storageKey(id: string) {
  return `buniya:popup:${id}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function OfferPopup({ offer }: { offer: PopupOffer }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!offer.is_active || !isScheduleActive(offer.starts_at, offer.ends_at)) {
      return;
    }

    try {
      if (offer.frequency === "once_per_visit" && sessionStorage.getItem(storageKey(offer.id))) {
        return;
      }
      if (
        offer.frequency === "once_per_day" &&
        localStorage.getItem(storageKey(offer.id)) === today()
      ) {
        return;
      }
    } catch {
      // Storage can be unavailable; showing the offer is still safe.
    }

    const delay = Math.max(0, offer.delay_seconds ?? 5) * 1000;
    const timer = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(timer);
  }, [offer]);

  useEffect(() => {
    if (!open) return;
    try {
      if (offer.frequency === "once_per_visit") {
        sessionStorage.setItem(storageKey(offer.id), "1");
      }
      if (offer.frequency === "once_per_day") {
        localStorage.setItem(storageKey(offer.id), today());
      }
    } catch {
      // Ignore storage errors.
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, offer]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close offer"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-popup-headline"
        className="relative grid w-full max-w-3xl animate-fade-up overflow-hidden rounded-3xl border border-line bg-cream shadow-lift sm:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="relative hidden min-h-[26rem] sm:block">
          <SafeImage
            src={offer.image_url}
            alt=""
            sizes="(min-width: 640px) 40vw, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-clay/15 via-transparent to-transparent"
          />
        </div>

        <div className="relative flex flex-col justify-center px-6 py-9 sm:px-9 sm:py-11">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close offer"
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>

          <p className="eyebrow text-clay">A little note from Buniya</p>
          <h2
            id="offer-popup-headline"
            className="mt-4 font-serif text-[clamp(1.9rem,4vw,2.7rem)] font-light leading-[1.02] tracking-[-0.035em]"
          >
            {offer.headline}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{offer.body}</p>

          {offer.coupon_code ? (
            <div className="mt-6 flex items-center gap-3">
              <CopyCode code={offer.coupon_code} />
              <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                Copy &amp; apply at checkout
              </span>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={offer.cta_href || "/shop"}
              onClick={() => setOpen(false)}
              className={buttonStyles({ size: "md" })}
            >
              {offer.cta_label || "Start exploring"}
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
