import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Disallow all crawlers since all pages require authentication
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: "https://contacts.helvety.com/sitemap.xml",
  };
}
