import type { MetadataRoute } from "next";

/**
 * Sitemap configuration
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://contacts.helvety.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
