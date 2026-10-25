import { Camera } from "lucide-react";
import { getProductReviews } from "@/lib/data/reviews";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewStars } from "@/components/reviews/review-stars";

export async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await getProductReviews(productId, 6);
  if (!reviews.length) return null;

  const average =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  const photoCount = reviews.reduce((total, review) => total + review.images.length, 0);

  return (
    <section
      aria-labelledby="product-reviews-heading"
      className="mt-14 border-t border-line pt-10 lg:mt-20 lg:pt-12"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">Customer notes</p>
          <h2
            id="product-reviews-heading"
            className="mt-3 font-serif text-[clamp(1.9rem,3.5vw,2.9rem)] font-light leading-[1.03] tracking-[-0.035em]"
          >
            Loved in real life
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Words and photographs from customers who ordered this piece.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4 border border-line bg-cream px-4 py-3">
          <span className="font-serif text-3xl font-light leading-none">
            {average.toFixed(1)}
          </span>
          <span>
            <ReviewStars rating={average} />
            <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.12em] text-muted">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              {photoCount ? ` · ${photoCount} ${photoCount === 1 ? "photo" : "photos"}` : ""}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {photoCount ? (
        <p className="mt-4 flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
          <Camera className="size-3.5" aria-hidden />
          Customer photos · tap to open full size
        </p>
      ) : null}
    </section>
  );
}
