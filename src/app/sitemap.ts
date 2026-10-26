import type { MetadataRoute } from "next";
import { getCategories, getSitemapProducts } from "@/lib/data/catalog";
import { absoluteAssetUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getSitemapProducts(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/offers"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/business"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/policies"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/shop?category=${category.slug}`),
    lastModified: category.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
    const images = product.images
      .map((image) => absoluteAssetUrl(image))
      .filter((image): image is string => Boolean(image))
      .slice(0, 5);

    return {
      url: absoluteUrl(`/shop/${product.slug}`),
      lastModified: product.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
      ...(images.length ? { images } : {}),
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
