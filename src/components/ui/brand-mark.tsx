"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/ui/wordmark";

export function BrandMark({
  name,
  subLabel,
  logoUrl,
  textClassName,
  subLabelClassName,
  logoClassName,
  frameClassName,
}: {
  name: string;
  subLabel?: string;
  logoUrl?: string | null;
  textClassName?: string;
  subLabelClassName?: string;
  logoClassName?: string;
  frameClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!logoUrl || failedSrc === logoUrl) {
    return (
      <Wordmark
        name={name}
        subLabel={subLabel}
        className={textClassName}
        subLabelClassName={subLabelClassName}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center justify-center", frameClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- logos can point at any host or path */}
      <img
        src={logoUrl}
        alt={name}
        className={cn(
          "block h-9 w-auto max-w-[10rem] object-contain",
          logoClassName,
        )}
        onError={() => setFailedSrc(logoUrl)}
      />
    </span>
  );
}
