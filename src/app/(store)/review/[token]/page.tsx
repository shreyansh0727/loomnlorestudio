import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Camera, Package } from "lucide-react";
import { getOrderByToken, type OrderWithDetails } from "@/lib/data/account";
import { getOrderReviews } from "@/lib/data/reviews";
import { getProductsByIds } from "@/lib/data/catalog";
import { getSiteSettings } from "@/lib/data/content";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewStars } from "@/components/reviews/review-stars";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Share a review",
  robots: { index: false, follow: false },
};

interface ReviewablePiece {
  productId: string;
  name: string;
  image: string | null;
  variants: string[];
}

function reviewablePieces(order: OrderWithDetails) {
  const pieces = new Map<string, ReviewablePiece>();
  order.items
    .filter((item) => item.item_type === "product" && item.product_id)
    .forEach((item) => {
      const productId = item.product_id as string;
      const existing = pieces.get(productId);
      if (existing) {
        if (item.variant_label) existing.variants.push(item.variant_label);
        return;
      }
      pieces.set(productId, {
        productId,
        name: item.name,
        image: item.image_url,
        variants: item.variant_label ? [item.variant_label] : [],
      });
    });
  return [...pieces.values()];
}

function ReviewUnavailable({ title, body }: { title: string; body: string }) {
  return (
    <div className="editorial-container py-16 lg:py-24">
      <div className="mx-auto max-w-xl border border-line bg-cream p-6 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sand text-clay">
          <Package className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-light tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const pieces = reviewablePieces(order);
  if (order.status !== "delivered") {
    return (
      <ReviewUnavailable
        title="Reviews open after delivery."
        body="We will email this link once your parcel has arrived and the order is marked delivered."
      />
    );
  }
  if (!pieces.length) {
    return (
      <ReviewUnavailable
        title="This order was a bundle."
        body="Bundles are reviewed as a whole rather than piece by piece. Write to us and we will happily pass your note to the workroom."
      />
    );
  }

  const [reviews, products, settings] = await Promise.all([
    getOrderReviews(order.id),
    getProductsByIds(pieces.map((piece) => piece.productId)),
    getSiteSettings(),
  ]);

  const reviewByProduct = new Map(
    reviews.map((review) => [review.product_id, review] as const),
  );
  const productSlugById = new Map(
    products.map((product) => [product.id, product.slug] as const),
  );
  const firstName = order.customer_name.split(" ")[0] || "friend";
  const reviewedCount = pieces.filter((piece) => reviewByProduct.has(piece.productId)).length;

  return (
    <div className="editorial-container py-10 lg:py-16">
      <Link
        href={`/order/${order.access_token}`}
        className="inline-flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to order {order.order_number}
      </Link>

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow text-clay">A note from you</p>
        <h1 className="mt-3 font-serif text-[clamp(2.4rem,5vw,4rem)] font-light leading-[1.02] tracking-[-0.04em]">
          How are your pieces settling in?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Thank you, {firstName}. Your parcel arrived{" "}
          {order.delivered_at ? formatDate(order.delivered_at) : "recently"}. A few words
          and photographs help other customers choose, and help our small workroom keep
          improving.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-line py-4">
          <Badge tone="sage">
            <BadgeCheck className="size-3" aria-hidden />
            Verified order
          </Badge>
          <span className="text-[0.64rem] uppercase tracking-[0.12em] text-muted">
            {ORDER_STATUS_LABELS[order.status]} · {pieces.length}{" "}
            {pieces.length === 1 ? "piece" : "pieces"} to review
          </span>
          {reviewedCount ? (
            <span className="text-[0.64rem] uppercase tracking-[0.12em] text-ink-soft">
              {reviewedCount} of {pieces.length} shared
            </span>
          ) : null}
        </div>

        {!isSupabaseConfigured ? (
          <p className="mt-5 border border-line bg-cream/70 px-4 py-3 text-xs leading-relaxed text-muted">
            Preview mode: review submissions are disabled until the store is connected to
            its database.
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        {pieces.map((piece) => {
          const review = reviewByProduct.get(piece.productId);
          const productSlug = productSlugById.get(piece.productId);

          return (
            <section key={piece.productId} className="border border-line bg-cream">
              <header className="flex gap-4 border-b border-line p-5">
                <div className="relative size-20 shrink-0 overflow-hidden border border-line bg-sand sm:size-24">
                  {piece.image ? (
                    <SafeImage src={piece.image} alt={piece.name} sizes="96px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="eyebrow text-muted">A piece from your order</p>
                  <h2 className="mt-1.5 font-serif text-2xl font-light leading-tight tracking-[-0.02em]">
                    {productSlug ? (
                      <Link href={`/shop/${productSlug}`} className="hover:text-clay-deep">
                        {piece.name}
                      </Link>
                    ) : (
                      piece.name
                    )}
                  </h2>
                  {piece.variants.length ? (
                    <p className="mt-1 text-xs text-muted">
                      {[...new Set(piece.variants)].join(" · ")}
                    </p>
                  ) : null}
                </div>
              </header>

              <div className="p-5">
                {review ? (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <ReviewStars rating={review.rating} starClassName="size-4" />
                      <span className="text-[0.6rem] uppercase tracking-[0.12em] text-sage">
                        Published · thank you
                      </span>
                    </div>
                    {review.title ? (
                      <h3 className="mt-3 font-serif text-xl font-light">{review.title}</h3>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                    {review.images.length ? (
                      <div
                        className={
                          review.images.length === 2
                            ? "mt-4 grid grid-cols-2 gap-1.5"
                            : review.images.length === 3
                              ? "mt-4 grid grid-cols-3 gap-1.5"
                              : "mt-4 grid grid-cols-4 gap-1.5"
                        }
                      >
                        {review.images.map((image, index) => (
                          <a
                            key={`${image}-${index}`}
                            href={image}
                            target="_blank"
                            rel="noreferrer"
                            className="relative aspect-square overflow-hidden border border-line bg-sand"
                            aria-label={`Open photo ${index + 1} in a new tab`}
                          >
                            <SafeImage
                              src={image}
                              alt={`Photo shared by ${review.reviewer_name}`}
                              sizes="15vw"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      <Camera className="size-3.5" aria-hidden />
                      Add a note and photos
                    </p>
                    <ReviewForm
                      token={order.access_token}
                      productId={piece.productId}
                      productSlug={productSlug}
                      defaultName={firstName}
                    />
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl">
          This private review page came from your delivery email. Each piece can be
          reviewed once, and photos are published as uploaded.
        </p>
        <a
          href={`mailto:${settings.supportEmail}?subject=${encodeURIComponent(
            `Review help · ${order.order_number}`,
          )}`}
          className="link-underline shrink-0 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
        >
          Need a hand?
        </a>
      </div>
    </div>
  );
}
