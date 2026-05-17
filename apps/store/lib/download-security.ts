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

/** Shared IP-scoped key for public download-url generation throttling. */
export function buildDownloadUrlRateLimitKey(clientIp: string): string {
  return `download_url:ip:${clientIp}`;
}

/** Shared IP-scoped key for public download endpoint throttling. */
export function buildPublicDownloadRateLimitKey(clientIp: string): string {
  return `public-download:ip:${clientIp}`;
}

/**
 * Ensures public download redirects only target trusted Supabase storage origins.
 * Allowlist uses `NEXT_PUBLIC_SUPABASE_URL` through `getSupabaseUrl()` — not `SUPABASE_URL`.
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
      return process.env.NODE_ENV !== "production";
    }

    if (!allowedOrigins.has(parsed.origin)) {
      return false;
    }

    return parsed.pathname.startsWith("/storage/v1/object/sign/packages/");
  } catch {
    return false;
  }
}
