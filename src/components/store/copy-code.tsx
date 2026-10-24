"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CopyCode({
  code,
  className,
  tone = "light",
  label = "Copy code",
}: {
  code: string;
  className?: string;
  tone?: "light" | "dark";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`${code} copied to your clipboard.`);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy the code. Please type it at checkout.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${label}: ${code}`}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.63rem] font-semibold uppercase tracking-[0.14em] transition-colors",
        tone === "light"
          ? "border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream"
          : "border-cream/30 text-cream hover:border-cream hover:bg-cream hover:text-ink",
        className,
      )}
    >
      <span>{copied ? "Copied" : code}</span>
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5 opacity-60" aria-hidden />
      )}
    </button>
  );
}
