/**
 * Centralized configuration for all Helvety apps.
 *
 * Derives all predictable values (URLs, cookie domain, ports) from NODE_ENV.
 * No environment variables needed for these -- they're always the same.
 */

const isDev = process.env.NODE_ENV === "development";

/** Production domain */
export const DOMAIN = "helvety.com";

/** Development gateway (multi-zone entry point) */
const DEV_GATEWAY = "http://localhost:3001";

/**
 * App base URLs for navigation, redirects, metadata, etc.
 *
 * Dev:  http://localhost:3001/{app}
 * Prod: https://helvety.com/{app}
 */
export const urls = {
  home: isDev ? DEV_GATEWAY : `https://${DOMAIN}`,
  auth: isDev ? `${DEV_GATEWAY}/auth` : `https://${DOMAIN}/auth`,
  store: isDev ? `${DEV_GATEWAY}/store` : `https://${DOMAIN}/store`,
  pdf: isDev ? `${DEV_GATEWAY}/pdf` : `https://${DOMAIN}/pdf`,
  tasks: isDev ? `${DEV_GATEWAY}/tasks` : `https://${DOMAIN}/tasks`,
  contacts: isDev ? `${DEV_GATEWAY}/contacts` : `https://${DOMAIN}/contacts`,
} as const;

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
} as const;
