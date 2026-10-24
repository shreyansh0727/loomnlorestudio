"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const gallery = images.length ? images : [""];
  const [active, setActive] = useState(0);

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:gap-4">
      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${gallery.length}`}
              aria-pressed={index === active}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden border transition-colors sm:w-full",
                index === active ? "border-ink" : "border-transparent hover:border-line",
              )}
            >
              <SafeImage src={image} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-sand">
        <SafeImage
          src={gallery[active]}
          alt={name}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <p className="absolute bottom-3 left-3 bg-cream/85 px-2.5 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.15em] text-ink-soft backdrop-blur-sm">
          Made in small batches
        </p>
      </div>
    </div>
  );
}
