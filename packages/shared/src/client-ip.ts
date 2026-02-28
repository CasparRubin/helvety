/**
 * Shared client IP extraction based on proxy headers.
 *
 * - Uses x-real-ip as the primary source.
 * - Optionally falls back to x-forwarded-for outside production.
 * - Can require trusted proxy headers in production (fail closed).
 * - Header trust depends on upstream proxy configuration.
 */

/** Minimal header accessor used by the client IP helper. */
type HeaderSource = {
  get(name: string): string | null;
};

/** Optional trust/fallback behavior for client IP extraction. */
type ClientIpOptions = {
  requireTrustedProxyInProduction?: boolean;
  fallback?: string | null;
};

/**
 * Resolve client IP from request headers using a consistent trust policy.
 */
export function getTrustedClientIp(
  headers: HeaderSource,
  options?: ClientIpOptions
): string | null {
  const requireTrustedProxyInProduction =
    options?.requireTrustedProxyInProduction ?? false;
  const fallback = options?.fallback ?? null;

  const trustedIp = headers.get("x-real-ip")?.trim();
  if (trustedIp) {
    return trustedIp;
  }

  const forwarded = headers.get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",")[0]?.trim();
  if (forwardedIp && process.env.NODE_ENV !== "production") {
    return forwardedIp;
  }

  if (
    requireTrustedProxyInProduction &&
    process.env.NODE_ENV === "production"
  ) {
    return null;
  }

  return fallback;
}
