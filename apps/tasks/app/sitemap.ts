import type { MetadataRoute } from "next";

/**
 * Sitemap configuration
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for the tasks app. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://tasks.helvety.com",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
