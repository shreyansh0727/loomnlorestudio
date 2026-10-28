import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getSiteSettings } from "@/lib/data/content";
import { getViewer } from "@/lib/auth";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/store/product/product-reviews";
import { Breadcrumbs } from "@/components/store/breadcrumbs";
import { StructuredData } from "@/components/seo/structured-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProductReviewSummary } from "@/lib/data/reviews";
import { breadcrumbSchema, productSchema } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";

async function RelatedPieces({
  categoryId,
  productId,
  categorySlug,
  categoryName,
  isB2B,
}: {
  categoryId: string;
  productId: string;
  categorySlug?: string;
  categoryName?: string;
  isB2B: boolean;
}) {
  const related = await getRelatedProducts(categoryId, productId, 4);
  if (!related.length) return null;

  return (
    <section className="border-t border-line bg-cream/60 py-14 lg:py-20">
      <div className="editorial-container">
        <SectionHeading
          eyebrow="Continue exploring"
          title="You may also like"
          href={categorySlug ? `/shop?category=${categorySlug}` : "/shop"}
          linkLabel={categoryName ? `All ${categoryName.toLowerCase()}` : "View all"}
        />
        <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {related.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              isB2B={isB2B}
              imageSizes="(min-width: 1024px) 23vw, 50vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedSkeleton() {
  return (
    <section aria-hidden className="border-t border-line bg-cream/60 py-14 lg:py-20">
      <div className="editorial-container">
        <div className="h-2.5 w-28 animate-pulse bg-line/60" />
        <div className="mt-4 h-8 w-52 max-w-full animate-pulse bg-line/40" />
        <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[4/5] w-full animate-pulse bg-line/30" />
              <div className="mt-4 h-2.5 w-3/4 animate-pulse bg-line/40" />
              <div className="mt-2 h-2.5 w-1/3 animate-pulse bg-line/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);
  if (!product) {
    return {
      title: "Piece not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    product.short_description ??
    `Shop ${product.name} from the ${settings.brandName} collection.`;
  const canonical = `/shop/${product.slug}`;
  const image = product.images[0];

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: settings.brandName,
      locale: "en_IN",
      url: canonical,
      title: product.name,
      description,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, viewer, settings] = await Promise.all([
    getProductBySlug(slug),
    getViewer(),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  const category = product.category;
  const reviewSummary = await getProductReviewSummary(product.id);

  return (
    <>
      <StructuredData
        data={[
          productSchema({ product, settings, rating: reviewSummary }),
          breadcrumbSchema([
            { name: "Shop", path: "/shop" },
            ...(category
              ? [{ name: category.name, path: `/shop?category=${category.slug}` }]
              : []),
            { name: product.name, path: `/shop/${product.slug}` },
          ]),
        ]}
      />
      <div className="editorial-container pb-16 pt-8 lg:pb-24 lg:pt-10">
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            ...(category
              ? [{ label: category.name, href: `/shop?category=${category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <ProductDetail
          product={product}
          isB2B={viewer.isB2B}
          isSignedIn={Boolean(viewer.user)}
          shippingPolicy={settings.shippingPolicy}
          returnsPolicy={settings.returnsPolicy}
        />

        <Suspense fallback={null}>
          <ProductReviews productId={product.id} />
        </Suspense>

        <div className="mt-12 border-t border-line pt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back to the collection
          </Link>
        </div>
      </div>

      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedPieces
          categoryId={product.category_id}
          productId={product.id}
          categorySlug={category?.slug}
          categoryName={category?.name}
          isB2B={viewer.isB2B}
        />
      </Suspense>
    </>
  );
}
