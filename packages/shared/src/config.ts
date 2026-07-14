/**
 * Centralized configuration for Helvety web apps in this monorepo (helvety.com Next.js path zones).
 *
 * Derives default values (URLs, cookie domain, ports) from NODE_ENV for the
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

/**
 * App base URLs for navigation, redirects, metadata, etc.
 *
 * Dev:  http://localhost:3001/{app}
 * Prod: https://helvety.com/{app}
 *
 * Prefer {@link urls.storeProducts} for Store catalog CTAs (skips the store-root
 * redirect). Keep {@link urls.store} for the zone base, metadata, account, and SEO.
 */
export const urls = {
  home: isDev ? DEV_GATEWAY : `https://${DOMAIN}`,
  auth: isDev ? `${DEV_GATEWAY}/auth` : `https://${DOMAIN}/auth`,
  store: isDev ? `${DEV_GATEWAY}/store` : `https://${DOMAIN}/store`,
  /** Store catalog landing (avoids `/store` → `/store/products` redirect). */
  storeProducts: isDev
    ? `${DEV_GATEWAY}/store/products`
    : `https://${DOMAIN}/store/products`,
  pdf: isDev ? `${DEV_GATEWAY}/pdf` : `https://${DOMAIN}/pdf`,
  imageUpscaler: isDev
    ? `${DEV_GATEWAY}/image-upscaler`
    : `https://${DOMAIN}/image-upscaler`,
  imageEditor: isDev
    ? `${DEV_GATEWAY}/image-editor`
    : `https://${DOMAIN}/image-editor`,
  ocr: isDev ? `${DEV_GATEWAY}/ocr` : `https://${DOMAIN}/ocr`,
  tasks: isDev ? `${DEV_GATEWAY}/tasks` : `https://${DOMAIN}/tasks`,
  contacts: isDev ? `${DEV_GATEWAY}/contacts` : `https://${DOMAIN}/contacts`,
  notes: isDev ? `${DEV_GATEWAY}/notes` : `https://${DOMAIN}/notes`,
  links: isDev ? `${DEV_GATEWAY}/links` : `https://${DOMAIN}/links`,
} as const;

/**
 * Convert an app URL to a Next.js-friendly root-relative href when possible.
 *
 * Returns a path-based href (`/store/products`, `/tasks`, etc.) for absolute
 * Helvety URLs on `helvety.com`, `*.helvety.com`, `localhost`, or `127.0.0.1`
 * when you want **`next/link`** without a **`basePath`** (for example
 * **`apps/web`**, the gateway) so same-origin navigation stays path-shaped.
 *
 * Do **not** use this for cross-app **`Link`** targets rendered inside apps with
 * a Next **`basePath`** (`/auth`, `/store`, …): Next prepends that prefix to
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
 * Cookie domain for session sharing.
 *
 * In dev: undefined (defaults to current host).
 * In prod: .helvety.com (shared across all path-based apps).
 */
export const COOKIE_DOMAIN: string | undefined = isDev
  ? undefined
  : `.${DOMAIN}`;

/**
 * Development-only: direct app ports for WebAuthn origins,
 * gateway rewrites, etc.
 */
export const DEV_PORTS = {
  web: 3001,
  auth: 3002,
  store: 3003,
  pdf: 3004,
  tasks: 3005,
  contacts: 3006,
  notes: 3007,
  imageUpscaler: 3008,
  imageEditor: 3010,
  links: 3009,
  ocr: 3011,
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
