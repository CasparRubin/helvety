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

/** Ensures public download redirects only target trusted Supabase storage origins. */
export function isAllowedDownloadUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;

    const allowedOrigins = new Set<string>();
    const envCandidates = [
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_URL,
    ];
    for (const candidate of envCandidates) {
      if (!candidate) continue;
      try {
        allowedOrigins.add(new URL(candidate).origin);
      } catch {
        // Ignore malformed env values; runtime validation handles these separately.
      }
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
