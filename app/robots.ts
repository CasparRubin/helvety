import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Allow public pages, disallow auth-protected routes
 * Explicitly allow AI crawlers for maximum visibility
 */
export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = [
    "/account",
    "/subscriptions",
    "/tenants",
    "/api",
    "/auth",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: disallowedPaths },
      { userAgent: "GPTBot", allow: "/", disallow: disallowedPaths },
      { userAgent: "ClaudeBot", allow: "/", disallow: disallowedPaths },
      { userAgent: "Google-Extended", allow: "/", disallow: disallowedPaths },
      { userAgent: "PerplexityBot", allow: "/", disallow: disallowedPaths },
      { userAgent: "Applebot-Extended", allow: "/", disallow: disallowedPaths },
      { userAgent: "CCBot", allow: "/", disallow: disallowedPaths },
      { userAgent: "FacebookBot", allow: "/", disallow: disallowedPaths },
    ],
    sitemap: "https://store.helvety.com/sitemap.xml",
  };
}
