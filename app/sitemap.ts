import type { MetadataRoute } from "next";

/**
 * Sitemap for public pages
 * Note: /account, /subscriptions, /tenants require auth and are excluded
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for public store pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://store.helvety.com",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://store.helvety.com/products",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://store.helvety.com/products/helvety-spo-explorer",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
