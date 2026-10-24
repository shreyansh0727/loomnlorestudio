import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/constants";

export function Wordmark({
  name = BRAND_NAME,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const [first, ...rest] = name.split("&");
  const hasAmpersand = rest.length > 0;

  return (
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
}
