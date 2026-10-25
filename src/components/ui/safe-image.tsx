"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallbackClassName?: string;
  quality?: number;
}

/**
 * Image wrapper that keeps the editorial layout intact when a media file
 * has not been uploaded yet, instead of rendering a broken image.
 */
export function SafeImage({
  src,
  alt,
  sizes = "100vw",
  priority,
  className,
  fallbackClassName,
  quality,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "absolute inset-0 overflow-hidden bg-sand",
          fallbackClassName,
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(70,47,58,0.05) 0px, rgba(70,47,58,0.05) 1px, transparent 1px, transparent 7px), repeating-linear-gradient(25deg, rgba(200,101,127,0.07) 0px, rgba(200,101,127,0.07) 1px, transparent 1px, transparent 11px)",
          }}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
