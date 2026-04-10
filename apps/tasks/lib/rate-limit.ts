/**
 * Rate Limiting - Tasks App
 *
 * Re-exports the shared rate-limit engine from @helvety/shared and defines
 * tasks-specific rate limit configurations.
 *
 * The core engine (checkRateLimit, resetRateLimit) lives in the shared package
 * so that security fixes propagate to all apps automatically.
 */

import { RATE_LIMITS as SHARED_RATE_LIMITS } from "@helvety/shared/rate-limit";

/**
 * Tasks-specific rate limit configurations
 */
export const RATE_LIMITS = {
  ENCRYPTION_UNLOCK: SHARED_RATE_LIMITS.ENCRYPTION_UNLOCK,
  API: SHARED_RATE_LIMITS.API,
  READ: SHARED_RATE_LIMITS.READ,
} as const;
