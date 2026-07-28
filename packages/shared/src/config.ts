/**
 * Centralized configuration for Helvety web apps in this monorepo (helvety.com Next.js path zones).
 *
 * Derives default values (URLs, ports) from NODE_ENV for the
 * current Helvety deployment model.
 */

import type { Viewport } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Production domain */
export const DOMAIN = "helvety.com";

/** Contact email used in error pages, support links, and legal references */
export const CONTACT_EMAIL = "contact@helvety.com";

/** Development gateway (multi-zone entry point) */
const DEV_GATEWAY = "http://localhost:3001";

/** Sister product: Helvety Cloud (end-to-end encrypted workspace). */
export const CLOUD_DOMAIN = "helvety.cloud";

/**
 * App base URLs for navigation, redirects, metadata, etc.
 *
 * Dev:  http://localhost:3001/{app}
 * Prod: https://helvety.com/{app}
 *
 * Prefer {@link urls.storeProducts} for Store catalog CTAs (skips the store-root
 * redirect). Keep {@link urls.store} for the zone base, metadata, and SEO.
 * {@link urls.cloud} is always the production Cloud origin (separate product).
 */
export const urls = {
  home: isDev ? DEV_GATEWAY : `https://${DOMAIN}`,
  store: isDev ? `${DEV_GATEWAY}/store` : `https://${DOMAIN}/store`,
  /** Store catalog landing (avoids `/store` → `/store/products` redirect). */
  storeProducts: isDev
    ? `${DEV_GATEWAY}/store/products`
    : `https://${DOMAIN}/store/products`,
  pdf: isDev ? `${DEV_GATEWAY}/pdf` : `https://${DOMAIN}/pdf`,
  imageEditor: isDev
    ? `${DEV_GATEWAY}/image-editor`
    : `https://${DOMAIN}/image-editor`,
  ocr: isDev ? `${DEV_GATEWAY}/ocr` : `https://${DOMAIN}/ocr`,
  /** Helvety Cloud workspace (https://helvety.cloud), not a helvety.com zone. */
  cloud: `https://${CLOUD_DOMAIN}`,
} as const;

/**
 * Convert an app URL to a Next.js-friendly root-relative href when possible.
 *
 * Returns a path-based href (`/store/products`, `/pdf`, etc.) for absolute
 * Helvety URLs on `helvety.com`, `*.helvety.com`, `localhost`, or `127.0.0.1`
 * when you want **`next/link`** without a **`basePath`** (for example
 * **`apps/web`**, the gateway) so same-origin navigation stays path-shaped.
 *
 * Do **not** use this for cross-app **`Link`** targets rendered inside apps with
 * a Next **`basePath`** (`/store`, `/pdf`, …): Next prepends that prefix to
 * path-only hrefs and breaks other zones. **`AppSwitcher`** uses absolute **`urls.*`**
 * hrefs instead.
 *
 * Keep **absolute** `urls.*` strings for metadata, Open Graph, redirects,
 * `new URL()`, APIs, or plain `<a href>`.
 *
 * Falls back to the original value if parsing fails.
 */
export function getLocalAppHref(url: string): string {
  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isHelvetyHost = host === DOMAIN || host.endsWith(`.${DOMAIN}`);
    const isLocalhostHost = host === "localhost" || host === "127.0.0.1";

    if (!isHelvetyHost && !isLocalhostHost) {
      return url;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/**
 * Development-only: direct app ports for gateway rewrites, etc.
 */
export const DEV_PORTS = {
  web: 3001,
  store: 3002,
  pdf: 3003,
  imageEditor: 3004,
  ocr: 3005,
} as const;

/** Shared viewport config reused by each web app layout in this monorepo */
export const sharedViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1816" },
  ],
};
