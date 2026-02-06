import type { MetadataRoute } from "next";

/**
 * Generates sitemap.xml with all public pages for search engines
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://helvety.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://helvety.com/impressum",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://helvety.com/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://helvety.com/terms",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
