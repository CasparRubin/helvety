import { urls } from "@helvety/shared/config";

import { getCachedAllProducts } from "@/lib/data/product-catalog-cache";

import type { MetadataRoute } from "next";

/**
 * Sitemap for public pages
 * Dynamically generates entries for all products
 * Note: /account requires auth and is excluded
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for public store pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const products = getCachedAllProducts();

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${urls.store}/products/${product.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: urls.store,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${urls.store}/products`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${urls.store}/llms.txt`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    ...productEntries,
  ];
}
