import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className={cn("eyebrow mb-3 text-clay", align === "center" && "justify-center")}>
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-[clamp(2rem,4vw,3.35rem)] font-light leading-[1.02] tracking-[-0.035em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-[0.95rem]">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="link-underline inline-flex shrink-0 items-center gap-1.5 self-start text-[0.67rem] font-semibold uppercase tracking-[0.16em] text-ink-soft sm:self-auto"
        >
          {linkLabel}
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
