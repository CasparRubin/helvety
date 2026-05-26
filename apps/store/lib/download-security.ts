import { getSupabaseUrl } from "@helvety/shared/env-validation";
import { z } from "zod";

/** Public download package ids (`/store/api/packages/{id}/download`): lowercase alphanumeric with hyphens. */
export const packageIdSchema = z
  .string()
  .min(1, "Package ID is required")
  .max(100, "Package ID too long")
  .regex(
    /^[a-z0-9-]+$/,
    "Package ID must be lowercase alphanumeric with hyphens"
  );

const SIGNED_PACKAGES_PREFIX = "/storage/v1/object/sign/packages/";

/** Rejects literal or percent-encoded `..` segments before pathname normalization. */
function containsPathTraversal(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return lower.includes("..") || lower.includes("%2e%2e");
}

/** True when pathname is a signed object under the `packages` bucket without traversal. */
function isAllowedSignedPackagesPath(pathname: string): boolean {
  const normalized = new URL(pathname, "https://local.invalid").pathname;
  if (!normalized.startsWith(SIGNED_PACKAGES_PREFIX)) {
    return false;
  }

  const objectPath = normalized.slice(SIGNED_PACKAGES_PREFIX.length);
  if (!objectPath) {
    return false;
  }

  const segments = objectPath.split("/");
  if (segments.length < 2) {
    return false;
  }

  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("..")
  );
}

/** Shared IP-scoped key for public package download throttling. */
export function buildPublicDownloadRateLimitKey(clientIp: string): string {
  return `public-download:ip:${clientIp}`;
}

/**
 * Ensures HTTP redirects from the public package download route only target
 * trusted Supabase Storage origins. Uses `NEXT_PUBLIC_SUPABASE_URL` through
 * `getSupabaseUrl()` — not `SUPABASE_URL`.
 */
export function isAllowedDownloadUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;

    const allowedOrigins = new Set<string>();
    try {
      allowedOrigins.add(new URL(getSupabaseUrl()).origin);
    } catch {
      // Ignore when public Supabase URL is unset; non-production may allow below.
    }

    if (allowedOrigins.size === 0) {
      return false;
    }

    if (!allowedOrigins.has(parsed.origin)) {
      return false;
    }

    if (containsPathTraversal(parsed.pathname)) {
      return false;
    }

    const normalizedPath = new URL(parsed.pathname, parsed.origin).pathname;
    return isAllowedSignedPackagesPath(normalizedPath);
  } catch {
    return false;
  }
}
