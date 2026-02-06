import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Allow public pages, disallow auth-protected routes
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/subscriptions", "/tenants", "/api", "/auth"],
    },
    sitemap: "https://store.helvety.com/sitemap.xml",
  };
}
