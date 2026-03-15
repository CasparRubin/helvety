/**
 * Shared SEO helpers for sitemap and robots.txt generation.
 *
 * Centralizes shared sitemap/robots factories and path sanitization
 * utilities used by sub-apps.
 */

import { urls } from "./config";

import type { MetadataRoute } from "next";

const DOMAIN = urls.home;

/** Normalizes path shape to compare disallow and sitemap paths safely. */
function normalizePath(path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) return "";
  if (trimmedPath === "/") return "/";

  const normalizedPath = trimmedPath.startsWith("/")
    ? trimmedPath
    : `/${trimmedPath}`;
  return normalizedPath.endsWith("/")
    ? normalizedPath.slice(0, -1)
    : normalizedPath;
}

/**
 * Prevents self-blocking robots rules by removing:
 * - the sitemap file path itself
 * - the canonical app URL advertised by that sitemap
 */
function sanitizeDisallowedPaths(
  disallowedPaths: string[],
  sitemapPath: string
): string[] {
  const normalizedSitemapPath = normalizePath(sitemapPath);
  const canonicalAppPath =
    normalizedSitemapPath.replace(/\/sitemap\.xml$/, "") || "/";

  return [...new Set(disallowedPaths.map((path) => normalizePath(path)))]
    .filter((path) => path !== "")
    .filter((path) => path !== normalizedSitemapPath)
    .filter((path) => path !== canonicalAppPath);
}

/**
 * Creates a sitemap for a sub-app, including:
 * - the app root URL
 * - optionally, the app's llms.txt URL
 *
 * @param basePath - The app's base path (e.g. "/auth", "/pdf")
 */
export function createAppSitemap(
  basePath: string,
  options?: {
    includeLlms?: boolean;
  }
): () => MetadataRoute.Sitemap {
  const lastModified = new Date();
  const includeLlms = options?.includeLlms ?? true;

  return function sitemap(): MetadataRoute.Sitemap {
    const entries: MetadataRoute.Sitemap = [
      {
        url: `${DOMAIN}${basePath}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 1,
      },
    ];

    if (includeLlms) {
      entries.push({
        url: `${DOMAIN}${basePath}/llms.txt`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }

    return entries;
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
  const sanitizedDisallowedPaths = sanitizeDisallowedPaths(
    disallowedPaths,
    sitemapPath
  );

  return function robots(): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: sanitizedDisallowedPaths,
      },
      sitemap: `${DOMAIN}${sitemapPath}`,
      host: DOMAIN,
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
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: `${DOMAIN}${sitemapPath}`,
      host: DOMAIN,
    };
  };
}

/**
 * Creates a robots.txt configuration for private/auth-required apps.
 * The app remains accessible to authenticated users, but is excluded from crawling.
 *
 * @param sitemapPath - Path to the sitemap (e.g. "/tasks/sitemap.xml")
 */
export function createPrivateAppRobots(
  sitemapPath?: string,
  options?: {
    includeSitemap?: boolean;
  }
): () => MetadataRoute.Robots {
  const includeSitemap = options?.includeSitemap ?? false;

  return function robots(): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      ...(includeSitemap && sitemapPath
        ? { sitemap: `${DOMAIN}${sitemapPath}` }
        : {}),
      host: DOMAIN,
    };
  };
}

/**
 * Creates an intentionally empty sitemap for private/auth-required apps.
 * This avoids advertising non-indexable URLs to crawlers.
 */
export function createPrivateAppSitemap(): () => MetadataRoute.Sitemap {
  return function sitemap(): MetadataRoute.Sitemap {
    return [];
  };
}
