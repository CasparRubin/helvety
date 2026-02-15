/**
 * Rate Limiting - Tasks App
 *
 * Re-exports the shared rate-limit engine from @helvety/shared and defines
 * tasks-specific rate limit configurations.
 *
 * The core engine (checkRateLimit, resetRateLimit) lives in the shared package
 * so that security fixes propagate to all apps automatically.
 */

// Re-export the shared rate-limit engine
export { checkRateLimit, resetRateLimit } from "@helvety/shared/rate-limit";

export type { RateLimitResult } from "@helvety/shared/rate-limit";

/**
 * Tasks-specific rate limit configurations
 */
export const RATE_LIMITS = {
  /** Encryption unlock attempts: 5 per minute per user */
  ENCRYPTION_UNLOCK: { maxRequests: 5, windowMs: 60 * 1000 },
  /** API calls (mutations): 100 per minute per user */
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Read-only actions: 300 per minute per user (prevents scraping/enumeration) */
  READ: { maxRequests: 300, windowMs: 60 * 1000 },
} as const;
