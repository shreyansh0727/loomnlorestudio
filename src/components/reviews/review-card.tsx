import Link from "next/link";
import { BadgeCheck, Camera } from "lucide-react";
import type { ProductReview } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { ReviewStars } from "@/components/reviews/review-stars";

export function ReviewCard({
  review,
  showProduct = false,
}: {
  review: ProductReview;
  showProduct?: boolean;
}) {
  return (
    <article className="flex h-full flex-col border border-line bg-cream p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReviewStars rating={review.rating} />
        <time
          dateTime={review.created_at}
          className="text-[0.6rem] uppercase tracking-[0.12em] text-muted"
        >
          {formatDate(review.created_at)}
        </time>
      </div>

      {review.title ? (
        <h3 className="mt-3 font-serif text-xl font-light leading-snug tracking-[-0.02em]">
          {review.title}
        </h3>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.body}</p>

      {review.images.length ? (
        <div
          className={
            review.images.length === 1
              ? "mt-4"
              : review.images.length === 2
                ? "mt-4 grid grid-cols-2 gap-1.5"
                : review.images.length === 3
                  ? "mt-4 grid grid-cols-3 gap-1.5"
                  : "mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
          }
        >
          {review.images.map((image, index) => (
            <a
              key={`${image}-${index}`}
              href={image}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-square overflow-hidden border border-line bg-sand"
              aria-label={`Open customer photo ${index + 1} in a new tab`}
            >
              <SafeImage
                src={image}
                alt={`Photo shared by ${review.reviewer_name}`}
                sizes="(min-width: 1024px) 12vw, 25vw"
                className="transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <Camera className="size-3" aria-hidden />
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{review.reviewer_name}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-sage">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verified purchase
          </p>
        </div>
        {showProduct && review.product ? (
          <Link
            href={`/shop/${review.product.slug}`}
            className="link-underline max-w-full truncate text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-ink-soft"
          >
            {review.product.name}
          </Link>
        ) : (
          <Badge tone="sand">Buniya</Badge>
        )}
      </div>
    </article>
  );
}
