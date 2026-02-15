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
export { checkRateLimit, resetRateLimit } from "@helvety/shared/rate-limit";

export type { RateLimitResult } from "@helvety/shared/rate-limit";

/**
 * Store-specific rate limit configurations
 */
export const RATE_LIMITS = {
  /** API calls: 100 per minute per user */
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  /** Checkout session creation: 10 per minute per IP */
  CHECKOUT: { maxRequests: 10, windowMs: 60 * 1000 },
  /** Download requests: 30 per minute per user */
  DOWNLOADS: { maxRequests: 30, windowMs: 60 * 1000 },
  /** Tenant management: 20 per minute per user */
  TENANTS: { maxRequests: 20, windowMs: 60 * 1000 },
  /** Subscription read actions: 30 per minute per user */
  SUBSCRIPTION_READ: { maxRequests: 30, windowMs: 60 * 1000 },
  /** Subscription mutation actions (cancel/reactivate): 5 per minute per user */
  SUBSCRIPTION_MUTATE: { maxRequests: 5, windowMs: 60 * 1000 },
  /** Stripe portal session creation: 5 per minute per user */
  PORTAL: { maxRequests: 5, windowMs: 60 * 1000 },
  /** Account mutations (email change, deletion): 3 per minute per user */
  ACCOUNT_MUTATE: { maxRequests: 3, windowMs: 60 * 1000 },
  /** Data export: 3 per minute per user */
  DATA_EXPORT: { maxRequests: 3, windowMs: 60 * 1000 },
  /** Signed download URL generation: 10 per minute per user */
  DOWNLOAD_URL: { maxRequests: 10, windowMs: 60 * 1000 },
  /** Package metadata reads: 30 per minute per user */
  PACKAGE_META: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;
