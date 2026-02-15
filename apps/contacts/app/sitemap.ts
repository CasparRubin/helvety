import type { MetadataRoute } from "next";

/**
 * Sitemap configuration
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for the contacts app. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://helvety.com/contacts",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
