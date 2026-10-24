"use client";

import { Plus } from "lucide-react";
import type { CartLine } from "@/lib/cart/types";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

export function QuickAdd({
  line,
  label = "Add to bag",
  className,
}: {
  line: CartLine;
  label?: string;
  className?: string;
}) {
  const { addLine } = useCart();

  return (
    <button
      type="button"
      onClick={() => addLine(line)}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-3 bg-cream/95 px-3.5 text-[0.61rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-soft backdrop-blur-sm transition-colors hover:bg-ink hover:text-cream",
        className,
      )}
    >
      {label}
      <Plus className="size-3.5" strokeWidth={1.8} />
    </button>
  );
}
