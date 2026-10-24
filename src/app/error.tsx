"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { BRAND_NAME } from "@/lib/constants";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-line">
        <div className="editorial-container flex h-20 items-center">
          <Link href="/" aria-label={`${BRAND_NAME} home`}>
            <Wordmark />
          </Link>
        </div>
      </header>

      <main className="editorial-container flex flex-1 items-center py-16 lg:py-24">
        <div className="max-w-xl">
          <p className="eyebrow text-clay">Something went wrong</p>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,5vw,3.8rem)] font-light leading-[1] tracking-[-0.04em]">
            The loom stopped mid-thread.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            This page could not be loaded. No payment details were changed. Try once
            more, or return to the shop and we will pick the thread back up.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Try again
            </Button>
            <Link href="/" className={buttonStyles({ variant: "secondary" })}>
              Return home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
