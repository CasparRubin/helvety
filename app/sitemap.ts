import type { MetadataRoute } from "next";

/**
 * Generates sitemap.xml with all public pages for search engines
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for public pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://helvety.com",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://helvety.com/impressum",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://helvety.com/privacy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://helvety.com/terms",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
