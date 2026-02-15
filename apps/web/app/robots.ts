import type { MetadataRoute } from "next";

/**
 * Robots.txt configuration
 * Allow all crawlers including AI bots for maximum public visibility
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "FacebookBot", allow: "/" },
    ],
    sitemap: "https://helvety.com/sitemap.xml",
  };
}
