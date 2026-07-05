import {
  CONTACT_LINK_PICKER_COLUMNS,
  E2EE_PREFETCH_COLUMNS,
} from "./e2ee-entity-columns";
import { RATE_LIMITS } from "./rate-limit";

export { CONTACT_LINK_PICKER_COLUMNS, E2EE_PREFETCH_COLUMNS };

/** Read rate limit for encrypted dashboard list prefetch GET routes (tighter than READ). */
export const ENCRYPTED_PREFETCH_READ_RATE_LIMIT = RATE_LIMITS.PREFETCH;

/** `authenticateAndRateLimit` options for encrypted list prefetch API routes. */
export function encryptedPrefetchAuthOptions(rateLimitPrefix: string): {
  rateLimitPrefix: string;
  readRateLimitConfig: typeof RATE_LIMITS.PREFETCH;
} {
  return {
    rateLimitPrefix,
    readRateLimitConfig: ENCRYPTED_PREFETCH_READ_RATE_LIMIT,
  };
}

/** Explicit column lists for prefetch queries (no `select("*")`). */
export const ENCRYPTED_PREFETCH_COLUMNS = E2EE_PREFETCH_COLUMNS;
