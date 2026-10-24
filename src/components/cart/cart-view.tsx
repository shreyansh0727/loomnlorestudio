"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { calculateInclusiveTax } from "@/lib/pricing";
import { formatMoney, unitLabel } from "@/lib/utils";

export function CartView({ gstRate }: { gstRate: number }) {
  const { lines, hydrated, itemCount, subtotal, updateQuantity, removeLine, clearCart } =
    useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const tax = calculateInclusiveTax(subtotal, gstRate);
  const hasB2B = lines.some((line) => line.buyerType === "b2b");

  if (!hydrated) {
    return (
      <div className="editorial-container py-16">
        <div className="h-48 animate-pulse border border-line bg-cream/60" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="editorial-container py-14 lg:py-20">
        <EmptyState
          icon={<ShoppingBag className="size-7" strokeWidth={1.3} />}
          title="Your bag is empty"
          description="Start with a length of cloth, a quiet layer for the table, or a bundle put together by the studio."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/shop" className={buttonStyles({ size: "md" })}>
                Browse the collection
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/offers"
                className={buttonStyles({ size: "md", variant: "secondary" })}
              >
                View offers
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="editorial-container py-10 lg:py-14">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_23rem] lg:gap-14">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <p className="text-[0.64rem] uppercase tracking-[0.15em] text-muted">
              {itemCount} {itemCount === 1 ? "piece" : "pieces"} in your bag
            </p>
            {confirmClear ? (
              <div className="flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.13em]">
                <span className="text-muted">Remove everything?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setConfirmClear(false);
                  }}
                  className="font-semibold text-red-900 underline-offset-4 hover:underline"
                >
                  Yes, empty
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-ink-soft hover:text-ink"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-[0.62rem] uppercase tracking-[0.13em] text-muted transition-colors hover:text-ink"
              >
                Empty bag
              </button>
            )}
          </div>

          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-4 py-6 sm:gap-6">
                <Link
                  href={line.kind === "product" ? `/shop/${line.slug}` : "/offers"}
                  className="relative block h-32 w-24 shrink-0 overflow-hidden bg-sand sm:h-36 sm:w-28"
                >
                  <SafeImage
                    src={line.imageUrl}
                    alt={line.name}
                    sizes="112px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.15em] text-muted">
                        {line.kind === "combo" ? "Combo bundle" : line.buyerType === "b2b" ? "Wholesale" : "Retail"}
                      </p>
                      <h2 className="mt-1 font-serif text-lg leading-snug tracking-[-0.015em] sm:text-xl">
                        <Link
                          href={line.kind === "product" ? `/shop/${line.slug}` : "/offers"}
                          className="link-underline"
                        >
                          {line.name}
                        </Link>
                      </h2>
                      {"variantLabel" in line && line.variantLabel ? (
                        <p className="mt-1 text-xs text-muted">{line.variantLabel}</p>
                      ) : null}
                      {line.kind === "combo" ? (
                        <ul className="mt-2 space-y-0.5 text-[0.68rem] text-muted">
                          {line.components.map((component, index) => (
                            <li key={`${component.name}-${index}`}>
                              {component.name}
                              {component.variantLabel ? ` · ${component.variantLabel}` : ""}
                              {component.quantity > 1 ? ` × ${component.quantity}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <p className="text-sm tabular-nums text-ink">
                      {formatMoney(line.unitPrice * line.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                    <div>
                      <div className="inline-flex h-9 items-center border border-line">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          disabled={line.quantity <= line.minQuantity}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="inline-flex size-8 items-center justify-center transition-colors hover:bg-ink/5 disabled:opacity-30"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-9 text-center text-xs tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          disabled={line.quantity >= line.maxQuantity}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="inline-flex size-8 items-center justify-center transition-colors hover:bg-ink/5 disabled:opacity-30"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="mt-2 text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                        {formatMoney(line.unitPrice)} / {unitLabel(line.unit, 1)}
                        {line.minQuantity > 1
                          ? ` · min ${line.minQuantity} ${unitLabel(line.unit, line.minQuantity)}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="inline-flex items-center gap-1.5 pb-1 text-[0.58rem] uppercase tracking-[0.13em] text-muted transition-colors hover:text-red-900"
                    >
                      <Trash2 className="size-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
            >
              <ArrowRight className="size-3.5 rotate-180" />
              Continue shopping
            </Link>
            <p className="text-[0.6rem] uppercase tracking-[0.13em] text-muted">
              Prices are verified again at checkout
            </p>
          </div>
        </div>

        <aside className="border border-line bg-cream p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-light tracking-[-0.025em]">Order summary</h2>

          <dl className="mt-6 space-y-3 border-b border-line pb-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">GST included ({gstRate}%)</dt>
              <dd className="tabular-nums text-muted">{formatMoney(tax.taxAmount)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-right text-xs leading-relaxed text-muted">
                Quoted after your order
              </dd>
            </div>
          </dl>

          <div className="flex items-baseline justify-between border-b border-line py-5">
            <span className="text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-ink-soft">
              Products total
            </span>
            <span className="font-serif text-2xl font-light tabular-nums">
              {formatMoney(subtotal)}
            </span>
          </div>

          <div className="mt-5 flex items-start gap-2.5 border border-line bg-paper/60 p-3.5">
            <Truck className="mt-0.5 size-4 shrink-0 text-clay" strokeWidth={1.5} />
            <p className="text-xs leading-relaxed text-muted">
              Shipping is arranged manually. After payment, we email a secure Razorpay link
              for the exact shipping charge before dispatch.
            </p>
          </div>

          <Link
            href="/checkout"
            className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}
          >
            Continue to checkout
            <ArrowRight className="size-4" />
          </Link>

          <p className="mt-4 text-center text-[0.58rem] uppercase tracking-[0.12em] text-muted">
            Coupon codes and GST details are entered at checkout
          </p>

          {hasB2B ? (
            <p className="mt-3 border-t border-line pt-4 text-[0.6rem] uppercase leading-relaxed tracking-[0.12em] text-sage">
              Wholesale bag · minimum quantities apply · GST invoice will be issued
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
