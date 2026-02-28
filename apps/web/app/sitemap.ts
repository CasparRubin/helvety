import { urls } from "@helvety/shared/config";

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
      url: urls.home,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${urls.home}/impressum`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${urls.home}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${urls.home}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
