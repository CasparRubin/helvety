/**
 * Rate Limiting - Store App
 *
 * Re-exports the shared rate-limit engine from @helvety/shared and defines
 * store-specific rate limit configurations.
 *
 * The core engine (checkRateLimit, resetRateLimit) lives in the shared package
 * so that security fixes propagate to all apps automatically.
 */

// Re-export the shared rate-limit engine
export { checkRateLimit } from "@helvety/shared/rate-limit";

/**
 * Store-specific rate limit configurations
 */
export const RATE_LIMITS = {
  /** API calls: 100 per minute per user */
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Download requests: 2 per minute per IP */
  DOWNLOADS: { maxRequests: 2, windowMs: 60 * 1000 },
  /** Account mutations (email change, deletion): 3 per minute per user */
  ACCOUNT_MUTATE: { maxRequests: 3, windowMs: 60 * 1000 },
  /** Data export: 3 per minute per user */
  DATA_EXPORT: { maxRequests: 3, windowMs: 60 * 1000 },
  /** Signed download URL generation: 10 per minute per IP */
  DOWNLOAD_URL: { maxRequests: 10, windowMs: 60 * 1000 },
} as const;
