import type { MetadataRoute } from "next";

/**
 * Sitemap for public pages
 * Note: /account, /subscriptions, /tenants require auth and are excluded
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://store.helvety.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://store.helvety.com/products",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://store.helvety.com/products/helvety-pdf",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://store.helvety.com/products/helvety-spo-explorer",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
