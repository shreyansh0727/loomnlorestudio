import { cn } from "@/lib/utils";

type BadgeTone =
  | "neutral"
  | "sage"
  | "clay"
  | "sand"
  | "dark"
  | "danger"
  | "outline";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-ink/6 text-ink-soft",
    sage: "bg-sage-light text-sage",
    clay: "bg-clay/10 text-clay-deep",
    sand: "bg-sand text-ink-soft",
    dark: "bg-ink text-cream",
    danger: "bg-red-900/10 text-red-900",
    outline: "border border-line bg-transparent text-ink-soft",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase leading-none tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
