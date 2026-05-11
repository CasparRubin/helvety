/**
 * Shared SEO helpers for helvety.com Next.js path zones: sitemap and robots.txt
 * generation, path sanitization, and {@link createHelvetyProductMetadata} for
 * consistent Next.js `Metadata` (Open Graph, Twitter, robots presets) across
 * the gateway and product routes in this monorepo.
 */

import { urls } from "./config";

import type { Metadata, MetadataRoute } from "next";

const GOOGLE_BOT_SNIPPET = {
  "max-video-preview": -1,
  "max-image-preview": "large" as const,
  "max-snippet": -1,
};

/** Input for {@link createHelvetyProductMetadata}. */
export type CreateHelvetyProductMetadataParams = Readonly<{
  metadataBase: string;
  title: { default: string; template: string };
  description: string;
  keywords: readonly string[];
  /** `openGraph.siteName` */
  siteName: string;
  /** `openGraph.url` and `alternates.canonical` */
  canonicalUrl: string;
  /** Primary OG/Twitter image (e.g. `brandAssets.identifierLogo`). */
  brandImage: Readonly<{
    url: string;
    width?: number;
    height?: number;
    /** `openGraph.images[0].alt` */
    ogAlt: string;
    /** When set, `twitter.images[0].alt`; otherwise Twitter image omits alt. */
    twitterAlt?: string;
  }>;
  manifest?: string;
  category?: string;
  /** `none` = noindex (E2EE zone, auth); `all` = indexable marketing/tools. */
  indexing: "none" | "all";
  /**
   * When set, used for `openGraph.title` and `twitter.title` instead of
   * `title.default` (same value in most apps).
   */
  socialTitle?: string;
}>;

/**
 * Builds Next.js `Metadata` shared across Helvety product apps: authors,
 * formatDetection, OG/Twitter cards, robots presets, canonical URL.
 */
export function createHelvetyProductMetadata(
  params: CreateHelvetyProductMetadataParams
): Metadata {
  const socialTitle = params.socialTitle ?? params.title.default;
  const index = params.indexing === "all";
  const imageWidth = params.brandImage.width ?? 500;
  const imageHeight = params.brandImage.height ?? 500;
  const ogImage = {
    url: params.brandImage.url,
    width: imageWidth,
    height: imageHeight,
    alt: params.brandImage.ogAlt,
  };
  const twitterImage =
    params.brandImage.twitterAlt !== undefined
      ? { url: params.brandImage.url, alt: params.brandImage.twitterAlt }
      : { url: params.brandImage.url };

  return {
    metadataBase: new URL(params.metadataBase),
    title: params.title,
    description: params.description,
    keywords: [...params.keywords],
    authors: [{ name: "Helvety" }],
    creator: "Helvety",
    publisher: "Helvety",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    ...(params.manifest !== undefined ? { manifest: params.manifest } : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: params.canonicalUrl,
      siteName: params.siteName,
      title: socialTitle,
      description: params.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description: params.description,
      images: [twitterImage],
    },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        ...GOOGLE_BOT_SNIPPET,
      },
    },
    alternates: {
      canonical: params.canonicalUrl,
    },
    ...(params.category !== undefined ? { category: params.category } : {}),
  };
}

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
 * Creates a sitemap for a helvety.com path-zone app, including:
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
 * Creates a robots.txt configuration for a helvety.com path-zone app.
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
