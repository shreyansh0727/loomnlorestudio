import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/constants";

export function Wordmark({
  name = BRAND_NAME,
  subLabel,
  className,
  subLabelClassName,
}: {
  name?: string;
  subLabel?: string;
  className?: string;
  subLabelClassName?: string;
}) {
  const [first, ...rest] = name.split("&");
  const hasAmpersand = rest.length > 0;

  const word = (
    <span
      className={cn(
        "inline-flex items-baseline gap-[0.3em] font-serif text-[1.35rem] font-medium leading-none tracking-[-0.03em]",
        className,
      )}
    >
      <span>{first.trim()}</span>
      {hasAmpersand ? (
        <span aria-hidden className="font-serif text-[0.85em] italic text-clay">
          &amp;
        </span>
      ) : null}
      {hasAmpersand ? <span>{rest.join("&").trim()}</span> : null}
    </span>
  );

  if (!subLabel) return word;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {word}
      <span
        className={cn(
          "text-[0.48rem] font-semibold uppercase tracking-[0.24em] text-muted",
          subLabelClassName,
        )}
      >
        {subLabel}
      </span>
    </span>
  );
}
