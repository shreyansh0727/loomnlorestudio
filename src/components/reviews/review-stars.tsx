import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewStars({
  rating,
  className,
  starClassName,
}: {
  rating: number;
  className?: string;
  starClassName?: string;
}) {
  const rounded = Math.round(rating);
  const label = Math.round(rating * 10) / 10;

  return (
    <span
      role="img"
      aria-label={`${label} out of 5 stars`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            "size-3.5",
            index < rounded ? "fill-clay text-clay" : "text-line",
            starClassName,
          )}
        />
      ))}
    </span>
  );
}
