/**
 * Rate Limiting - Contacts App
 *
 * Re-exports the shared rate-limit engine from @helvety/shared and defines
 * contacts-specific rate limit configurations.
 */

import { RATE_LIMITS as SHARED_RATE_LIMITS } from "@helvety/shared/rate-limit";

export const RATE_LIMITS = {
  ENCRYPTION_UNLOCK: SHARED_RATE_LIMITS.ENCRYPTION_UNLOCK,
  API: SHARED_RATE_LIMITS.API,
  READ: SHARED_RATE_LIMITS.READ,
  EXPORT: SHARED_RATE_LIMITS.EXPORT,
} as const;
