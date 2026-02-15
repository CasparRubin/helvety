/**
 * Redirect URI validation utilities
 *
 * Prevents open redirect vulnerabilities by validating redirect URIs
 * against a strict allowlist of trusted domains.
 */

/**
 * Explicit allowlist of trusted redirect hosts.
 *
 * All apps are served under helvety.com via path-based routing (multi-zone):
 *   helvety.com/auth, helvety.com/tasks, helvety.com/contacts, etc.
 *
 * Only the root domain is needed since all apps share the same origin.
 */
const ALLOWED_REDIRECT_HOSTS = new Set(["helvety.com"]);

/**
 * Allowed redirect URI patterns
 * Only these domains are permitted as redirect destinations
 *
 * Supports:
 * - Explicit allowlist of helvety.com (see ALLOWED_REDIRECT_HOSTS)
 * - localhost with any port (development only)
 * - 127.0.0.1 with any port (development only)
 */
const ALLOWED_REDIRECT_PATTERNS = [
  // Development only: localhost and 127.0.0.1 with any port
  // These are gated behind NODE_ENV to prevent redirect-based attacks in production
  ...(process.env.NODE_ENV !== "production"
    ? [
        /^http:\/\/localhost(:\d+)?(\/.*)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?(\/.*)?$/,
      ]
    : []),
];

/**
 * Validates a redirect URI against the allowlist
 */
export function isValidRedirectUri(uri: string | null | undefined): boolean {
  if (!uri) {
    return false;
  }

  try {
    // Ensure it's a valid URL
    const url = new URL(uri);

    // Block javascript: and data: protocols
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    // Check explicit host allowlist (helvety.com)
    if (url.protocol === "https:" && ALLOWED_REDIRECT_HOSTS.has(url.hostname)) {
      return true;
    }

    // Check regex patterns (development localhost/127.0.0.1)
    return ALLOWED_REDIRECT_PATTERNS.some((pattern) => pattern.test(uri));
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Validates and returns a safe redirect URI
 */
export function getSafeRedirectUri(
  uri: string | null | undefined,
  defaultUri?: string | null
): string | null {
  if (uri != null && isValidRedirectUri(uri)) {
    return uri;
  }
  return defaultUri ?? null;
}

/**
 * Validates that a path is a safe relative path (for internal redirects)
 */
export function isValidRelativePath(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }

  // Must start with / but not // (protocol-relative URL)
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  // Must not contain protocol indicators
  if (path.includes(":")) {
    return false;
  }

  return true;
}

/**
 * Gets a safe relative path, returning default if invalid
 */
export function getSafeRelativePath(
  path: string | null | undefined,
  defaultPath: string = "/"
): string {
  if (path != null && isValidRelativePath(path)) {
    return path;
  }
  return defaultPath;
}
