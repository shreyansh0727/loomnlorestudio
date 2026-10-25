import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatMoney, getStartingPrice, getTotalStock, unitLabel } from "@/lib/utils";
import { buildProductCartLine } from "@/lib/cart/cart-utils";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { QuickAdd } from "@/components/product/quick-add";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  isB2B,
  className,
  imageSizes = "(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw",
}: {
  product: Product;
  isB2B: boolean;
  className?: string;
  imageSizes?: string;
}) {
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const totalStock = getTotalStock(product);
  const singleVariant = activeVariants.length === 1 ? activeVariants[0] : null;
  const minQuantity = isB2B ? Math.max(1, product.moq) : 1;
  const canQuickAdd = Boolean(
    singleVariant && totalStock > 0 && singleVariant.stock_qty >= minQuantity,
  );

  const startingPrice = getStartingPrice(product, isB2B);
  const prices = activeVariants.map((variant) =>
    isB2B
      ? (variant.wholesale_price_override ?? product.wholesale_price ?? product.retail_price)
      : (variant.retail_price_override ?? product.retail_price),
  );
  const uniquePrices = new Set(prices);
  const showFrom = uniquePrices.size > 1;

  const line =
    singleVariant && canQuickAdd
      ? buildProductCartLine({
          product,
          variant: singleVariant,
          quantity: minQuantity,
          buyerType: isB2B ? "b2b" : "b2c",
        })
      : null;

  const isSale =
    !isB2B &&
    product.compare_at_price !== null &&
    product.compare_at_price > startingPrice;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[4.5rem] rounded-b-2xl border border-line/80 bg-sand">
        <Link
          href={`/shop/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-0"
        >
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            sizes={imageSizes}
            className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
          />
          <span className="absolute inset-0 bg-clay/0 transition-colors duration-500 group-hover:bg-clay/10" />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {totalStock === 0 ? (
            <Badge tone="dark">Sold out</Badge>
          ) : (
            <>
              {product.is_new_arrival ? <Badge tone="sage">New</Badge> : null}
              {product.is_best_seller && !product.is_new_arrival ? (
                <Badge tone="clay">Bestseller</Badge>
              ) : null}
              {isSale ? <Badge tone="sand">Sale</Badge> : null}
            </>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-0 opacity-100 transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
          {totalStock === 0 ? (
            <span className="flex h-10 items-center justify-center rounded-full bg-cream/90 text-[0.61rem] font-semibold uppercase tracking-[0.16em] text-muted">
              Currently unavailable
            </span>
          ) : line ? (
            <QuickAdd line={line} />
          ) : (
            <Link
              href={`/shop/${product.slug}`}
              className="flex h-10 items-center justify-between rounded-full bg-cream/95 px-4 text-[0.61rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-soft backdrop-blur-sm transition-colors hover:bg-clay hover:text-cream"
            >
              Choose options
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-clay/80">
            {product.category?.name ?? "Collection"}
          </p>
          {isB2B ? (
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.13em] text-sage">
              Trade
            </span>
          ) : null}
        </div>

        <h3 className="mt-1.5 font-serif text-lg font-normal leading-snug tracking-[-0.015em] text-ink">
          <Link href={`/shop/${product.slug}`} className="link-underline">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2.5">
          <p className="text-sm text-ink">
            {showFrom ? <span className="text-muted">from </span> : null}
            {formatMoney(startingPrice)}
            <span className="text-xs text-muted"> / {unitLabel(product.unit, 1)}</span>
          </p>
          {isSale ? (
            <p className="text-xs text-muted line-through">
              {formatMoney(product.compare_at_price!)}
            </p>
          ) : null}
        </div>
        {isB2B ? (
          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
            MOQ {product.moq} {unitLabel(product.unit, product.moq)} · GST invoice
          </p>
        ) : null}
      </div>
    </article>
  );
}
