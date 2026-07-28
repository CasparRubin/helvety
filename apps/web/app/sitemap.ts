import { urls } from "@helvety/shared/config";

import type { MetadataRoute } from "next";

/**
 * Generates sitemap.xml with indexable gateway pages for search engines.
 * Excludes llms.txt (agent discovery uses robots allow rules for public zones and gateway links).
 */

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generates the sitemap for public pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: urls.home,
      lastModified,
    },
    {
      url: `${urls.home}/impressum`,
      lastModified,
    },
    {
      url: `${urls.home}/privacy`,
      lastModified,
    },
    {
      url: `${urls.home}/terms`,
      lastModified,
    },
  ];
}
