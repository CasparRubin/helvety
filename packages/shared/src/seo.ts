/**
 * Shared SEO helpers for helvety.com Next.js path zones: sitemap and robots.txt
 * generation, path sanitization, and {@link createHelvetyProductMetadata} for
 * consistent Next.js `Metadata` (Open Graph, Twitter, robots presets) across
 * the gateway and product routes in this monorepo.
 *
 * Public zones use explicit allow rules for major AI crawlers (in addition to
 * `*`) so agentic systems can discover public `llms.txt` and indexable routes.
 * Google sitemaps list indexable page URLs only (`url` + `lastmod`);
 * `llms.txt` is not included. Non-indexable API paths on public product zones
 * are disallowed for those same user agents (and `*`) at the gateway via
 * {@link GATEWAY_DISALLOWED_PATHS}, mirrored in zone robots.
 *
 * Canonical crawl policy for compliant crawlers (RFC 9309 / Google) is only
 * `https://helvety.com/robots.txt` from the gateway (`createOpenRobots` with
 * {@link GATEWAY_DISALLOWED_PATHS}). Path-zone `/store/robots.txt`, `/pdf/robots.txt`,
 * etc. are mirrors for humans and agents that fetch them; they use host-absolute
 * disallow paths.
 */

import { urls } from "./config";

import type { Metadata, MetadataRoute } from "next";

const GOOGLE_BOT_SNIPPET = {
  "max-video-preview": -1,
  "max-image-preview": "large" as const,
  "max-snippet": -1,
};

/**
 * Major AI / answer-engine crawlers; explicit robots rules aid agentic discovery.
 * Training vs search/user tokens are listed separately in vendor docs; Helvety
 * allows both on public content (discovery-friendly). Official references:
 * OpenAI (GPTBot, OAI-SearchBot, ChatGPT-User), Anthropic (ClaudeBot, Claude-User,
 * Claude-SearchBot), Google-Extended, Perplexity (PerplexityBot, Perplexity-User),
 * Applebot-Extended.
 */
export const AI_DISCOVERY_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Google-Extended",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
] as const;

/**
 * Host-absolute paths disallowed in gateway `/robots.txt` (RFC 9309 source of
 * truth). Non-indexable API paths on the gateway and public product zones.
 */
export const GATEWAY_DISALLOWED_PATHS = [
  "/api",
  "/store/api",
  "/pdf/api",
  "/image-editor/api",
  "/ocr/api",
] as const;

/** Single Next.js `MetadataRoute.Robots` rule entry (user agent + allow/disallow). */
type RobotsRule = {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
};

/** Public crawl rules: `*` plus {@link AI_DISCOVERY_USER_AGENTS} with the same allow/disallow. */
function buildPublicCrawlerRules(disallowedPaths: string[] = []): RobotsRule[] {
  const disallow = disallowedPaths.length > 0 ? disallowedPaths : undefined;
  const base = {
    allow: "/" as const,
    ...(disallow !== undefined ? { disallow } : {}),
  };
  return [
    { userAgent: "*", ...base },
    ...AI_DISCOVERY_USER_AGENTS.map((userAgent) => ({
      userAgent,
      ...base,
    })),
  ];
}

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
  /** `none` = noindex; `all` = indexable marketing/tools. */
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
    applicationName: params.siteName,
    referrer: "origin-when-cross-origin",
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
      card: "summary_large_image",
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
 * Zone base path from a zone sitemap path (`/store/sitemap.xml` → `/store`).
 * Returns `""` for gateway-style sitemaps that are not under a path zone.
 */
function zoneBasePathFromSitemap(sitemapPath: string): string {
  const normalizedSitemapPath = normalizePath(sitemapPath);
  if (!normalizedSitemapPath.endsWith("/sitemap.xml")) {
    return "";
  }
  const withoutFile = normalizedSitemapPath.replace(/\/sitemap\.xml$/, "");
  return withoutFile === "" ? "" : withoutFile;
}

/**
 * Maps zone-relative disallow paths to host-absolute paths under the zone
 * basePath (`/api` + `/store` → `/store/api`). Paths already under the zone
 * prefix are left unchanged.
 */
export function toHostAbsoluteZonePaths(
  disallowedPaths: readonly string[],
  zoneBasePath: string
): string[] {
  const base = normalizePath(zoneBasePath);
  if (!base || base === "/") {
    return [
      ...new Set(disallowedPaths.map((path) => normalizePath(path))),
    ].filter((path) => path !== "");
  }

  return [
    ...new Set(
      disallowedPaths.map((path) => {
        const normalized = normalizePath(path);
        if (!normalized) return "";
        if (normalized === "/") return base;
        if (normalized === base || normalized.startsWith(`${base}/`)) {
          return normalized;
        }
        return `${base}${normalized}`;
      })
    ),
  ].filter((path) => path !== "");
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
 * Creates a sitemap for a helvety.com path-zone app with the canonical app root URL.
 *
 * @param basePath - The app's base path (e.g. "/pdf", "/ocr")
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
      },
    ];
  };
}

/**
 * Creates a robots.txt configuration for a helvety.com path-zone app.
 * Zone-relative disallow paths (`/api`) are prefixed with the zone
 * basePath derived from `sitemapPath` so mirrors use host-absolute rules.
 *
 * @param disallowedPaths - Zone-relative or host-absolute paths to disallow
 * @param sitemapPath - Path to the sitemap (e.g. "/pdf/sitemap.xml")
 */
export function createAppRobots(
  disallowedPaths: string[],
  sitemapPath: string
): () => MetadataRoute.Robots {
  const zoneBasePath = zoneBasePathFromSitemap(sitemapPath);
  const hostAbsolutePaths = toHostAbsoluteZonePaths(
    disallowedPaths,
    zoneBasePath
  );
  const sanitizedDisallowedPaths = sanitizeDisallowedPaths(
    hostAbsolutePaths,
    sitemapPath
  );

  return function robots(): MetadataRoute.Robots {
    return {
      rules: buildPublicCrawlerRules(sanitizedDisallowedPaths),
      sitemap: `${DOMAIN}${sitemapPath}`,
      host: DOMAIN,
    };
  };
}

/**
 * Creates gateway (or other open) robots.txt. Compliant crawlers only honor
 * `https://helvety.com/robots.txt`; pass {@link GATEWAY_DISALLOWED_PATHS} there.
 *
 * @param sitemapPath - Path to the sitemap (e.g. "/sitemap-index.xml")
 * @param disallowedPaths - Optional host-absolute paths to disallow
 */
export function createOpenRobots(
  sitemapPath: string,
  disallowedPaths: readonly string[] = []
): () => MetadataRoute.Robots {
  const normalizedDisallows = [
    ...new Set(disallowedPaths.map((path) => normalizePath(path))),
  ].filter((path) => path !== "" && path !== "/");

  return function robots(): MetadataRoute.Robots {
    return {
      rules: buildPublicCrawlerRules(normalizedDisallows),
      sitemap: `${DOMAIN}${sitemapPath}`,
      host: DOMAIN,
    };
  };
}
