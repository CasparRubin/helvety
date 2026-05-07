/**
 * Shared client IP extraction based on proxy headers.
 *
 * - Uses x-real-ip as the primary source.
 * - Falls back to x-forwarded-for when strict trusted-proxy mode is not required.
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

/** Validate dotted-quad IPv4 values. */
function isValidIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const parsed = Number.parseInt(part, 10);
    return parsed >= 0 && parsed <= 255;
  });
}

/** Validate canonical IPv6 values (without brackets). */
function isValidIpv6(value: string): boolean {
  if (!/^[0-9a-fA-F:]+$/.test(value)) return false;
  if (!value.includes(":")) return false;
  try {
    // URL can parse bracketed IPv6 hosts and rejects malformed values.
    const parsed = new URL(`http://[${value}]/`);
    return parsed.hostname.toLowerCase() === `[${value.toLowerCase()}]`;
  } catch {
    return false;
  }
}

/** Trim, dequote, and normalize potential IP header values. */
function normalizeIpCandidate(value: string | null | undefined): string | null {
  if (!value) return null;
  let candidate = value.trim().replace(/^"|"$/g, "");
  if (!candidate) return null;
  if (candidate.toLowerCase() === "unknown") return null;

  // Bracketed IPv6 with optional port: [2001:db8::1]:443
  if (candidate.startsWith("[")) {
    const endBracket = candidate.indexOf("]");
    if (endBracket === -1) return null;
    candidate = candidate.slice(1, endBracket);
  } else {
    // IPv4 with optional port: 203.0.113.7:443
    const maybeIpv4WithPort = candidate.match(/^(\d+\.\d+\.\d+\.\d+):\d+$/);
    if (maybeIpv4WithPort?.[1]) {
      candidate = maybeIpv4WithPort[1];
    }
  }

  if (isValidIpv4(candidate) || isValidIpv6(candidate)) {
    return candidate;
  }

  return null;
}

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
  const isProduction = process.env.NODE_ENV === "production";

  const trustedIp = normalizeIpCandidate(headers.get("x-real-ip"));
  const forwarded = headers.get("x-forwarded-for");
  const forwardedIp = normalizeIpCandidate(forwarded?.split(",")[0]?.trim());
  if (requireTrustedProxyInProduction && isProduction) {
    if (trustedIp) {
      return trustedIp;
    }
    return null;
  }

  if (trustedIp) {
    return trustedIp;
  }

  if (forwardedIp) {
    return forwardedIp;
  }

  return fallback;
}
