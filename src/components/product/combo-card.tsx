import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Combo } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { getComboRetailValue, getComboStock } from "@/lib/pricing";
import { buildComboCartLine } from "@/lib/cart/cart-utils";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { AddComboButton } from "@/components/product/add-combo-button";

export function ComboCard({
  combo,
  isB2B,
  className,
}: {
  combo: Combo;
  isB2B: boolean;
  className?: string;
}) {
  const retailValue = getComboRetailValue(combo);
  const savings = Math.max(0, retailValue - combo.bundle_price);
  const stock = getComboStock(combo);
  const line =
    stock > 0 ? buildComboCartLine({ combo, quantity: 1, buyerType: isB2B ? "b2b" : "b2c" }) : null;

  return (
    <article className={`group flex flex-col ${className ?? ""}`}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-t-[3.5rem] border border-b-0 border-line bg-sand">
        <Link href={`/offers#combo-${combo.slug}`} aria-label={combo.title} className="absolute inset-0">
          <SafeImage
            src={combo.image_url}
            alt={combo.title}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
          />
          <span className="absolute inset-0 bg-clay/0 transition-colors duration-500 group-hover:bg-clay/10" />
        </Link>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="clay">Combo</Badge>
          {savings > 0 ? (
            <Badge tone="sand">Save {formatMoney(savings)}</Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-b-2xl border-x border-b border-line bg-cream p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-clay">A little set</p>
            <h3 className="mt-2 font-serif text-xl font-normal leading-tight tracking-[-0.02em]">
              <Link href={`/offers#combo-${combo.slug}`} className="link-underline">
                {combo.title}
              </Link>
            </h3>
          </div>
          <Link
            href={`/offers#combo-${combo.slug}`}
            aria-label={`View ${combo.title}`}
            className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition-colors group-hover:border-clay group-hover:text-clay"
          >
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted">{combo.description}</p>

        <ul className="mt-4 space-y-1.5 border-t border-line/70 pt-4 text-xs text-ink-soft">
          {combo.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3">
              <span>{item.product?.name ?? "Included piece"}</span>
              <span className="text-muted">
                {item.quantity > 1 ? `× ${item.quantity}` : item.variant?.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-line/70 pt-4">
          <div>
            <p className="text-lg text-ink">{formatMoney(combo.bundle_price)}</p>
            {retailValue > combo.bundle_price ? (
              <p className="mt-0.5 text-xs text-muted">
                <span className="line-through">{formatMoney(retailValue)}</span> separately
              </p>
            ) : null}
          </div>
          {line ? (
            <AddComboButton line={line} />
          ) : (
            <span className="text-[0.62rem] uppercase tracking-[0.13em] text-muted">
              Currently unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
