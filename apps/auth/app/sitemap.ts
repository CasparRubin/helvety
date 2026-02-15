import type { MetadataRoute } from "next";

/**
 * Sitemap for the Auth app (helvety.com/auth)
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for the auth service. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://helvety.com/auth",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
