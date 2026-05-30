import { urls } from "@helvety/shared/config";

import { getCachedAllProducts } from "@/lib/data/product-catalog-cache";

import type { MetadataRoute } from "next";

/**
 * Sitemap for public store pages.
 * Dynamically generates entries for all products at build time.
 * Excludes /account (auth-gated) and llms.txt.
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for public store pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const products = getCachedAllProducts();

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${urls.store}/products/${product.slug}`,
    lastModified,
  }));

  return [
    {
      url: urls.store,
      lastModified,
    },
    {
      url: `${urls.store}/products`,
      lastModified,
    },
    ...productEntries,
  ];
}
