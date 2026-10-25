import Link from "next/link";
import type { OfferTickerItem } from "@/lib/types";
import { CopyCode } from "@/components/store/copy-code";

export function OfferTicker({ items }: { items: OfferTickerItem[] }) {
  if (!items.length) return null;

  const group = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {items.map((item) => (
        <div key={`${item.id}-${ariaHidden ? "dupe" : "main"}`} className="flex items-center gap-3">
          <span aria-hidden className="size-1 shrink-0 rounded-full bg-clay" />
          <Link
            href={item.href || "/offers"}
            className="whitespace-nowrap text-[0.63rem] font-medium uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-clay"
          >
            {item.text}
          </Link>
          {item.coupon_code ? (
            <CopyCode code={item.coupon_code} className="py-1" />
          ) : null}
        </div>
      ))}
    </div>
  );

  return (
    <section aria-label="Current offers" className="overflow-hidden border-y border-line bg-blush/50">
      <div className="group flex py-3 hover:[&_.marquee-track]:[animation-play-state:paused]">
        <div className="marquee-track flex w-max items-center">
          {group(false)}
          {group(true)}
        </div>
      </div>
    </section>
  );
}
