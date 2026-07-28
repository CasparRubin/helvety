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

const ALLOWED_DOWNLOAD_HOSTS = new Set([
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
]);

/**
 * Ensures HTTP redirects from the public package download route only target
 * trusted GitHub Releases hosts (fail closed for anything else).
 */
export function isAllowedDownloadUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      return false;
    }
    if (!ALLOWED_DOWNLOAD_HOSTS.has(parsed.hostname.toLowerCase())) {
      return false;
    }
    // github.com download links must stay under /owner/repo/releases/...
    if (parsed.hostname.toLowerCase() === "github.com") {
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
  } catch {
    return false;
  }
}
