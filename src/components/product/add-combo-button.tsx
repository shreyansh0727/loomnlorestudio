"use client";

import { ShoppingBag } from "lucide-react";
import type { CartLine } from "@/lib/cart/types";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

export function AddComboButton({
  line,
  className,
}: {
  line: CartLine;
  className?: string;
}) {
  const { addLine } = useCart();

  return (
    <button
      type="button"
      onClick={() => addLine(line)}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-ink/25 px-5 text-[0.61rem] font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream",
        className,
      )}
    >
      <ShoppingBag className="size-3.5" strokeWidth={1.7} />
      Add bundle
    </button>
  );
}
