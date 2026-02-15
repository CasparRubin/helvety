import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Allow landing/login pages for brand visibility, block auth callback and API routes
 * Explicitly allow AI crawlers
 */
export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = ["/api", "/auth/callback"];

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
    sitemap: "https://helvety.com/auth/sitemap.xml",
  };
}
