"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { MAX_B2C_QUANTITY } from "@/lib/constants";
import {
  formatMoney,
  getEffectivePrice,
  unitLabel,
} from "@/lib/utils";
import { buildProductCartLine } from "@/lib/cart/cart-utils";
import { useCart } from "@/components/cart/cart-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProductPurchasePanel({
  product,
  isB2B,
  isSignedIn,
  shippingPolicy,
  returnsPolicy,
}: {
  product: Product;
  isB2B: boolean;
  isSignedIn: boolean;
  shippingPolicy: string;
  returnsPolicy: string;
}) {
  const router = useRouter();
  const { addLine } = useCart();
  const variants = product.variants.filter((variant) => variant.is_active);
  const firstAvailable =
    variants.find((variant) => variant.stock_qty > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const selected = variants.find((variant) => variant.id === variantId) ?? null;
  const minimum = isB2B ? Math.max(1, product.moq) : 1;
  const availableMaximum = selected
    ? isB2B
      ? selected.stock_qty
      : Math.min(selected.stock_qty, MAX_B2C_QUANTITY)
    : 0;
  const [quantity, setQuantity] = useState(minimum);

  if (!variants.length) {
    return (
      <div className="border border-line bg-cream p-6">
        <p className="font-serif text-xl">This piece is being restocked.</p>
        <p className="mt-2 text-sm text-muted">
          Write to us and we will let you know when it returns.
        </p>
      </div>
    );
  }

  const price = selected
    ? getEffectivePrice(product, selected, isB2B)
    : product.retail_price;
  const canAdd = Boolean(selected && selected.stock_qty >= minimum);
  const maxQuantity = Math.max(minimum, availableMaximum);
  const clampedQuantity = Math.min(Math.max(quantity, minimum), maxQuantity);

  function chooseVariant(id: string) {
    setVariantId(id);
    const next = variants.find((variant) => variant.id === id);
    const nextMax = next
      ? isB2B
        ? next.stock_qty
        : Math.min(next.stock_qty, MAX_B2C_QUANTITY)
      : minimum;
    setQuantity(Math.max(minimum, Math.min(minimum, nextMax)));
  }

  function lineFor() {
    if (!selected) return null;
    return buildProductCartLine({
      product,
      variant: selected,
      quantity: clampedQuantity,
      buyerType: isB2B ? "b2b" : "b2c",
    });
  }

  function handleAdd() {
    const line = lineFor();
    if (line) addLine(line);
  }

  function handleBuyNow() {
    const line = lineFor();
    if (!line) return;
    addLine(line);
    router.push("/checkout");
  }

  return (
    <div className="min-w-0 lg:sticky lg:top-28">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="outline">{product.category?.name ?? "Collection"}</Badge>
        {product.is_new_arrival ? <Badge tone="sage">New arrival</Badge> : null}
        {product.is_best_seller ? <Badge tone="clay">Bestseller</Badge> : null}
        {isB2B ? <Badge tone="sage">Trade price</Badge> : null}
      </div>

      <h1 className="mt-4 font-serif text-[clamp(2.2rem,4.5vw,3.6rem)] font-light leading-[1.02] tracking-[-0.04em]">
        {product.name}
      </h1>
      {product.short_description ? (
        <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
          {product.short_description}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-line py-4">
        <p className="text-2xl text-ink">
          {formatMoney(price)}
          <span className="ml-1 text-sm text-muted">
            / {unitLabel(product.unit, 1)}
          </span>
        </p>
        {!isB2B && product.compare_at_price && product.compare_at_price > price ? (
          <p className="text-sm text-muted line-through">
            {formatMoney(product.compare_at_price)}
          </p>
        ) : null}
        <p className="w-full text-[0.62rem] uppercase tracking-[0.13em] text-muted">
          Inclusive of all taxes · {isB2B ? "GST invoice issued" : "Retail invoice"}
        </p>
        {isB2B && product.retail_price > price ? (
          <p className="w-full text-[0.62rem] uppercase tracking-[0.13em] text-sage">
            Retail {formatMoney(product.retail_price)} · your trade rate saves{" "}
            {formatMoney(product.retail_price - price)}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[0.63rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Choose {product.unit === "metre" ? "colour / width" : "option"}
          </p>
          {selected?.sku ? (
            <p className="text-[0.58rem] uppercase tracking-[0.14em] text-muted">
              SKU {selected.sku}
            </p>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((variant) => {
            const soldOut = variant.stock_qty <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                disabled={soldOut}
                onClick={() => chooseVariant(variant.id)}
                aria-pressed={variant.id === variantId}
                className={cn(
                  "relative rounded-full border px-4 py-2.5 text-xs transition-colors",
                  variant.id === variantId
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-cream/50 text-ink-soft hover:border-ink/40 hover:text-ink",
                  soldOut && "cursor-not-allowed opacity-40 line-through",
                )}
              >
                {variant.label}
                {soldOut ? <span className="sr-only"> (sold out)</span> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-[0.62rem] uppercase tracking-[0.13em] text-muted">
          {selected
            ? selected.stock_qty === 0
              ? "This option is sold out"
              : selected.stock_qty <= 5
                ? `Only ${selected.stock_qty} left in the workroom`
                : "In stock · ready to pack"
            : "Select an option"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex h-12 w-fit items-center border border-line bg-cream/50">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(minimum, clampedQuantity - 1))}
            disabled={clampedQuantity <= minimum}
            aria-label="Decrease quantity"
            className="inline-flex size-11 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-12 text-center text-sm tabular-nums">{clampedQuantity}</span>
          <button
            type="button"
            onClick={() =>
              setQuantity(Math.min(maxQuantity, clampedQuantity + 1))
            }
            disabled={clampedQuantity >= maxQuantity}
            aria-label="Increase quantity"
            className="inline-flex size-11 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <Button
          size="lg"
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1"
        >
          <ShoppingBag className="size-4" />
          Add to bag · {formatMoney(price * clampedQuantity)}
        </Button>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!canAdd}
        className={cn(buttonStyles({ variant: "secondary", size: "lg" }), "mt-3 w-full")}
      >
        Buy now
        <ArrowRight className="size-4" />
      </button>

      {isB2B ? (
        <p className="mt-3 text-center text-[0.62rem] uppercase tracking-[0.13em] text-sage">
          Wholesale minimum: {product.moq} {unitLabel(product.unit, product.moq)}
        </p>
      ) : (
        <p className="mt-3 text-center text-[0.62rem] uppercase tracking-[0.13em] text-muted">
          Retail limit: {MAX_B2C_QUANTITY} units per product · shipping quoted after checkout
        </p>
      )}

      <div className="mt-5 space-y-3 border-t border-line pt-5 text-[0.68rem] uppercase tracking-[0.12em] text-muted">
        <p className="flex items-center gap-2">
          <Check className="size-3.5 text-sage" />
          Secure Razorpay payment · UPI, cards and netbanking
        </p>
        <p className="flex items-center gap-2">
          <Check className="size-3.5 text-sage" />
          {isSignedIn ? "This order will appear in your account" : "Guest checkout available"}
        </p>
        <p className="flex items-center gap-2">
          <Check className="size-3.5 text-sage" />
          Packed by hand in Varanasi · dispatch in 2–4 working days
        </p>
      </div>

      {!isB2B ? (
        <div className="mt-6 border border-line bg-cream p-4">
          <p className="font-serif text-lg">Buying for a shop or studio?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Approved GST accounts unlock wholesale rates and per-product minimums.
          </p>
          <Link
            href="/business"
            className="link-underline mt-3 inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-clay"
          >
            Apply for a trade account
            <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : null}

      <div className="mt-8 divide-y divide-line border-y border-line">
        <details className="group py-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Details &amp; care
            <Plus className="size-3.5 transition-transform group-open:rotate-45" />
          </summary>
          <div className="prose-editorial mt-4 text-sm leading-relaxed text-muted">
            {(product.description ?? product.short_description ?? "")
              .split("\n\n")
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-soft">
            <div>
              <dt className="text-[0.58rem] uppercase tracking-[0.14em] text-muted">Sold as</dt>
              <dd className="mt-1">Per {unitLabel(product.unit, 1)}</dd>
            </div>
            <div>
              <dt className="text-[0.58rem] uppercase tracking-[0.14em] text-muted">
                {isB2B ? "Wholesale minimum" : "Order limit"}
              </dt>
              <dd className="mt-1">
                {isB2B
                  ? `${product.moq} ${unitLabel(product.unit, product.moq)}`
                  : `${MAX_B2C_QUANTITY} units per product`}
              </dd>
            </div>
          </dl>
        </details>

        <details className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Delivery &amp; shipping
            <Plus className="size-3.5 transition-transform group-open:rotate-45" />
          </summary>
          <p className="mt-4 text-sm leading-relaxed text-muted">{shippingPolicy}</p>
        </details>

        <details className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Returns
            <Plus className="size-3.5 transition-transform group-open:rotate-45" />
          </summary>
          <p className="mt-4 text-sm leading-relaxed text-muted">{returnsPolicy}</p>
        </details>
      </div>
    </div>
  );
}
