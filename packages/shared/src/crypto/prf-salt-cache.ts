/**
 * PRF Salt Cache
 *
 * Caches the PRF salt in localStorage so the login passkey ceremony
 * can include the PRF extension for single-touch encryption unlock.
 *
 * The PRF salt is NOT sensitive - it's a public parameter stored in the
 * database (user_passkey_params). The security comes from the passkey's
 * private key, not the salt. Caching it locally allows the login flow
 * to request PRF output during authentication without a separate unlock step.
 *
 * The salt is cached per-origin. Since all apps now share the same origin
 * (helvety.com via path-based routing), a salt cached during tasks unlock
 * is available during the next login on the same device.
 */

import { logger } from "../logger";

const PRF_SALT_CACHE_KEY = "helvety-prf-salt";

interface CachedPRFSalt {
  /** Base64-encoded PRF salt */
  prfSalt: string;
  /** PRF version for compatibility */
  version: number;
  /** Timestamp when cached */
  cachedAt: number;
}

/**
 * Cache the PRF salt in localStorage for use during login.
 * Call this after a successful encryption unlock or setup.
 */
export function cachePRFSalt(prfSalt: string, version: number): void {
  try {
    if (typeof localStorage === "undefined") return;

    const entry: CachedPRFSalt = {
      prfSalt,
      version,
      cachedAt: Date.now(),
    };

    localStorage.setItem(PRF_SALT_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable in some contexts (e.g., private browsing)
    logger.warn("Failed to cache PRF salt in localStorage");
  }
}

/**
 * Retrieve the cached PRF salt from localStorage.
 * Returns null if no cached salt is available or if it's invalid.
 */
export function getCachedPRFSalt(): CachedPRFSalt | null {
  try {
    if (typeof localStorage === "undefined") return null;

    const raw = localStorage.getItem(PRF_SALT_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedPRFSalt;

    // Basic validation
    if (!parsed.prfSalt || typeof parsed.version !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear the cached PRF salt.
 * Call this on logout to prevent stale salt from being used.
 */
export function clearCachedPRFSalt(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(PRF_SALT_CACHE_KEY);
  } catch {
    // Ignore errors
  }
}
