/**
 * Redirect URI validation utilities
 *
 * Prevents open redirect vulnerabilities by validating redirect URIs
 * against a configured allowlist of trusted hosts/protocols and dev-only
 * localhost patterns.
 */

/**
 * Explicit allowlist of canonical redirect hosts.
 *
 * Current production deployment serves apps under helvety.com via path-based
 * routing (multi-zone), e.g. helvety.com/auth, /tasks, /contacts.
 *
 * If deployment topology changes (preview domains, additional hosts), this
 * allowlist must be updated accordingly.
 *
 * Trusted direct app domains are handled separately and canonicalized to
 * helvety.com before final allowlist validation.
 */
const ALLOWED_REDIRECT_HOSTS = new Set(["helvety.com"]);
const DIRECT_APP_REDIRECT_HOSTS = new Set([
  "helvety-auth.vercel.app",
  "helvety-store.vercel.app",
  "helvety-pdf.vercel.app",
  "helvety-image-upscaler.vercel.app",
  "helvety-image-editor.vercel.app",
  "helvety-ocr.vercel.app",
  "helvety-tasks.vercel.app",
  "helvety-contacts.vercel.app",
  "helvety-notes.vercel.app",
  "helvety-links.vercel.app",
]);

/**
 * Allowed redirect URI patterns
 * Only these patterns are permitted as direct redirect destinations
 *
 * Supports:
 * - Explicit allowlist of canonical hosts (see ALLOWED_REDIRECT_HOSTS)
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

/** Converts trusted direct app-domain redirects to canonical helvety.com URLs. */
export function canonicalizeRedirectUri(
  uri: string | null | undefined
): string | null {
  if (!uri) {
    return null;
  }

  try {
    const url = new URL(uri);
    if (url.protocol !== "https:") {
      return null;
    }

    if (ALLOWED_REDIRECT_HOSTS.has(url.hostname)) {
      return url.toString();
    }

    if (!DIRECT_APP_REDIRECT_HOSTS.has(url.hostname)) {
      return null;
    }

    const canonical = new URL(url.toString());
    canonical.hostname = "helvety.com";
    return canonical.toString();
  } catch {
    return null;
  }
}

/**
 * Validates a redirect URI against the allowlist.
 *
 * Note: trusted direct app domains are intentionally not valid here unless
 * canonicalized first via canonicalizeRedirectUri/getSafeRedirectUri.
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
 * Validates against the configured host/protocol allowlist and returns
 * an allowed redirect URI.
 */
export function getSafeRedirectUri(
  uri: string | null | undefined,
  defaultUri?: string | null
): string | null {
  if (uri != null && isValidRedirectUri(uri)) {
    return uri;
  }

  const canonicalUri = canonicalizeRedirectUri(uri);
  if (canonicalUri && isValidRedirectUri(canonicalUri)) {
    return canonicalUri;
  }

  if (defaultUri != null && isValidRedirectUri(defaultUri)) {
    return defaultUri;
  }

  const canonicalDefault = canonicalizeRedirectUri(defaultUri);
  if (canonicalDefault && isValidRedirectUri(canonicalDefault)) {
    return canonicalDefault;
  }

  return null;
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
