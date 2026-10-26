import type { Product, SiteSettings } from "@/lib/types";
import { absoluteUrl, getStartingPrice } from "@/lib/utils";

export const DEFAULT_SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Handmade scrunchies, bows, ties and crochet accessories, crafted in Varanasi",
};

export function absoluteAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : absoluteUrl(trimmed);
}

function postalAddress(settings: SiteSettings) {
  const address = settings.sellerAddress;
  return {
    "@type": "PostalAddress",
    streetAddress: [address.line1, address.line2].filter(Boolean).join(", "),
    addressLocality: address.city,
    addressRegion: address.state,
    postalCode: address.pincode,
    addressCountry: address.country === "India" ? "IN" : address.country,
  };
}

function socialProfiles(settings: SiteSettings) {
  return [settings.instagramUrl, settings.facebookUrl, settings.pinterestUrl]
    .map((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      if (!/^https?:\/\//i.test(trimmed)) return null;
      try {
        // Bare platform roots are the untouched defaults, not real profiles.
        if (!new URL(trimmed).pathname.replace(/\/+$/, "")) return null;
      } catch {
        return null;
      }
      return trimmed;
    })
    .filter((value): value is string => Boolean(value));
}

export function organizationSchema(settings: SiteSettings) {
  const logo = absoluteAssetUrl(settings.logoUrl) ?? absoluteUrl("/icon.png");
  const sameAs = socialProfiles(settings);

  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": absoluteUrl("/#organization"),
    name: settings.brandName,
    legalName: settings.sellerLegalName,
    url: absoluteUrl("/"),
    logo,
    image: logo,
    description: settings.aboutText,
    email: settings.supportEmail,
    telephone: settings.supportPhone,
    address: postalAddress(settings),
    currenciesAccepted: "INR",
    paymentAccepted: "Razorpay, UPI, Credit Card, Debit Card, Net Banking",
    ...(sameAs.length ? { sameAs } : {}),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: settings.supportPhone,
        email: settings.supportEmail,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    ],
  };
}

export function websiteSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: absoluteUrl("/"),
    name: settings.brandName,
    description: settings.brandTagline,
    inLanguage: "en-IN",
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/shop")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productSchema({
  product,
  settings,
  rating,
}: {
  product: Product;
  settings: SiteSettings;
  rating?: { average: number; count: number } | null;
}) {
  const url = absoluteUrl(`/shop/${product.slug}`);
  const images = product.images
    .map((image) => absoluteAssetUrl(image))
    .filter((image): image is string => Boolean(image));
  const sku = product.variants.find((variant) => variant.sku)?.sku;
  const inStock = product.variants.some(
    (variant) => variant.is_active && variant.stock_qty > 0,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.short_description ??
      product.description ??
      `${product.name} from ${settings.brandName}.`,
    ...(images.length ? { image: images } : {}),
    ...(sku ? { sku } : {}),
    ...(product.category?.name ? { category: product.category.name } : {}),
    brand: { "@type": "Brand", name: settings.brandName },
    url,
    offers: {
      "@type": "Offer",
      url,
      price: (getStartingPrice(product, false) / 100).toFixed(2),
      priceCurrency: "INR",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": absoluteUrl("/#organization") },
    },
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average.toFixed(1),
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
