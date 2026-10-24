"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="editorial-container py-14 lg:py-20">
      <EmptyState
        title="We couldn't load this page"
        description="The studio is still here. Try again, or continue browsing the collection — nothing in your bag or account has changed."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Try again
            </Button>
            <Link href="/shop" className={buttonStyles({ variant: "secondary" })}>
              Browse the shop
            </Link>
          </div>
        }
      />
    </div>
  );
}
