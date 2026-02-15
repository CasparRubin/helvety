import type { MetadataRoute } from "next";

/** Static build-time date for consistent sitemap caching */
const lastModified = new Date();

/** Generate the sitemap for the PDF app. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://helvety.com/pdf",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
