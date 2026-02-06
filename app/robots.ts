import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Allow public pages, disallow API and auth routes
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", "/auth"],
    },
    sitemap: "https://pdf.helvety.com/sitemap.xml",
  };
}
