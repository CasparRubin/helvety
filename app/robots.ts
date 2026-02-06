import type { MetadataRoute } from "next";

/**
 * Generates robots.txt rules for search engine crawlers
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [],
    },
    sitemap: "https://helvety.com/sitemap.xml",
  };
}
