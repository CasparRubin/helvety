import { AUTH_MAX_LIFETIME_MS } from "./auth-session-policy";

/** Decode the JWT payload segment (no signature verification — use after getUser()). */
function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const payloadSegment = parts[1];
  if (!payloadSegment) {
    return null;
  }
  try {
    const padded = payloadSegment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, "=");
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns JWT `iat` in milliseconds, or null when absent/invalid. */
export function getJwtIssuedAtMs(accessToken: string): number | null {
  const payload = decodeJwtPayload(accessToken);
  const iat = payload?.iat;
  if (typeof iat !== "number" || !Number.isFinite(iat)) {
    return null;
  }
  return iat * 1000;
}

/**
 * True when the access token was issued within `maxLifetimeMs` of `now`.
 * Aligns client-side session caps with Supabase JWT/session time-box policy.
 */
export function isJwtWithinMaxLifetime(
  accessToken: string,
  maxLifetimeMs: number = AUTH_MAX_LIFETIME_MS,
  now: number = Date.now()
): boolean {
  const issuedAtMs = getJwtIssuedAtMs(accessToken);
  if (issuedAtMs === null) {
    return false;
  }
  return now - issuedAtMs <= maxLifetimeMs;
}
