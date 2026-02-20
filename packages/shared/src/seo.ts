/**
 * Shared SEO helpers for sitemap and robots.txt generation.
 *
 * Centralizes the bot allowlist and provides factories for the common
 * single-entry sitemap and standard robots patterns used by sub-apps.
 */

import type { MetadataRoute } from "next";

/** User agents explicitly allowed in robots.txt across all Helvety apps. */
const ALLOWED_USER_AGENTS = [
  "*",
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "PerplexityBot",
  "Applebot-Extended",
  "CCBot",
  "FacebookBot",
] as const;

const DOMAIN = "https://helvety.com";

/**
 * Creates a single-entry sitemap for a sub-app.
 *
 * @param basePath - The app's base path (e.g. "/auth", "/pdf")
 */
export function createAppSitemap(
  basePath: string
): () => MetadataRoute.Sitemap {
  const lastModified = new Date();

  return function sitemap(): MetadataRoute.Sitemap {
    return [
      {
        url: `${DOMAIN}${basePath}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 1,
      },
    ];
  };
}

/**
 * Creates a robots.txt configuration for a sub-app.
 *
 * @param disallowedPaths - Paths to disallow (e.g. ["/api", "/auth/callback"])
 * @param sitemapPath - Path to the sitemap (e.g. "/auth/sitemap.xml")
 */
export function createAppRobots(
  disallowedPaths: string[],
  sitemapPath: string
): () => MetadataRoute.Robots {
  return function robots(): MetadataRoute.Robots {
    return {
      rules: ALLOWED_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: disallowedPaths,
      })),
      sitemap: `${DOMAIN}${sitemapPath}`,
    };
  };
}

/**
 * Creates a robots.txt configuration with no disallowed paths.
 * Used by the web gateway which allows full crawling.
 *
 * @param sitemapPath - Path to the sitemap (e.g. "/sitemap.xml")
 */
export function createOpenRobots(
  sitemapPath: string
): () => MetadataRoute.Robots {
  return function robots(): MetadataRoute.Robots {
    return {
      rules: ALLOWED_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      sitemap: `${DOMAIN}${sitemapPath}`,
    };
  };
}
