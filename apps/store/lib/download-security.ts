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

/** Shared IP-scoped key for public package download throttling. */
export function buildPublicDownloadRateLimitKey(clientIp: string): string {
  return `public-download:ip:${clientIp}`;
}

const ALLOWED_GITHUB_DOWNLOAD_HOSTS = new Set([
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
]);

const SUPABASE_PUBLIC_PACKAGES_PREFIX = "/storage/v1/object/public/packages/";

/** GitHub Releases hosts used by SPFx downloads. */
function isAllowedGitHubDownloadUrl(parsed: URL): boolean {
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_GITHUB_DOWNLOAD_HOSTS.has(host)) {
    return false;
  }
  if (host === "github.com") {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 5) {
      return false;
    }
    if (parts[2] !== "releases") {
      return false;
    }
    if (parts.includes("..")) {
      return false;
    }
  }
  return true;
}

/**
 * Public Supabase Storage objects in the `packages` bucket
 * (`{ref}.supabase.co/storage/v1/object/public/packages/...`).
 */
function isAllowedSupabasePackagesUrl(parsed: URL): boolean {
  const host = parsed.hostname.toLowerCase();
  const labels = host.split(".");
  if (labels.length !== 3) {
    return false;
  }
  if (labels[1] !== "supabase" || labels[2] !== "co") {
    return false;
  }
  if (!labels[0]) {
    return false;
  }
  if (parsed.pathname.includes("..")) {
    return false;
  }
  if (!parsed.pathname.startsWith(SUPABASE_PUBLIC_PACKAGES_PREFIX)) {
    return false;
  }
  return parsed.pathname.length > SUPABASE_PUBLIC_PACKAGES_PREFIX.length;
}

/**
 * Ensures HTTP redirects from the public package download route only target
 * trusted GitHub Releases hosts or public `packages` objects on
 * `{ref}.supabase.co` (fail closed for anything else).
 */
export function isAllowedDownloadUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return (
      isAllowedGitHubDownloadUrl(parsed) || isAllowedSupabasePackagesUrl(parsed)
    );
  } catch {
    return false;
  }
}
