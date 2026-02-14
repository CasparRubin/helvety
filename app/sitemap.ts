import type { MetadataRoute } from "next";

/**
 * Sitemap for helvety-auth
 * Minimal sitemap for auth service - most pages should not be indexed
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for the auth service. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://auth.helvety.com",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.1,
    },
  ];
}
