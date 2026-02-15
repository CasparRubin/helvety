import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Allow landing page for brand visibility, block authenticated routes
 * Explicitly allow AI crawlers
 */
export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = ["/contacts", "/api", "/auth"];

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
    sitemap: "https://helvety.com/contacts/sitemap.xml",
  };
}
