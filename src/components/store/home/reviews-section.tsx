import { Camera } from "lucide-react";
import { getHomepageReviews } from "@/lib/data/reviews";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewStars } from "@/components/reviews/review-stars";
import { SectionHeading } from "@/components/ui/section-heading";

export async function ReviewsSection({
  title,
  subtitle,
  limit,
}: {
  title: string | null;
  subtitle: string | null;
  limit: number;
}) {
  const reviews = await getHomepageReviews(limit);
  if (!reviews.length) return null;

  const average =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  const photoCount = reviews.reduce((total, review) => total + review.images.length, 0);

  return (
    <section className="border-y border-line bg-cream/55 py-14 lg:py-20">
      <div className="editorial-container">
        <SectionHeading
          eyebrow="Kind words"
          title={title ?? "Loved in real life"}
          description={subtitle ?? undefined}
        />

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-4xl font-light leading-none tracking-[-0.03em]">
              {average.toFixed(1)}
            </span>
            <span>
              <ReviewStars rating={average} starClassName="size-4" />
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                From {reviews.length} verified{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </span>
          </div>
          {photoCount ? (
            <p className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-muted">
              <Camera className="size-3.5" aria-hidden />
              {photoCount} customer {photoCount === 1 ? "photo" : "photos"}
            </p>
          ) : null}
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-muted">
            Every note comes from a delivered order
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} showProduct />
          ))}
        </div>
      </div>
    </section>
  );
}
