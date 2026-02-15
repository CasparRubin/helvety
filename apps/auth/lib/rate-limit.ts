/**
 * Rate Limiting - Auth App
 *
 * Re-exports the shared rate-limit engine from @helvety/shared and defines
 * auth-specific rate limit configurations.
 *
 * The core engine (checkRateLimit, resetRateLimit, OTP lockout) lives in the
 * shared package so that security fixes propagate to all apps automatically.
 */

// Re-export the shared rate-limit engine
export {
  checkRateLimit,
  resetRateLimit,
  recordOtpFailureAndCheckLockout,
  checkEscalatingLockout,
  resetEscalatingLockout,
} from "@helvety/shared/rate-limit";

export type { RateLimitResult } from "@helvety/shared/rate-limit";

/**
 * Auth-specific rate limit configurations
 */
export const RATE_LIMITS = {
  /** Passkey authentication: 10 per minute per IP */
  PASSKEY: { maxRequests: 10, windowMs: 60 * 1000 },
  /** Verification code / OTP email requests: 3 per 5 minutes per email */
  OTP: { maxRequests: 3, windowMs: 5 * 60 * 1000 },
  /** OTP code verification attempts: 5 per 5 minutes per email */
  OTP_VERIFY: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
} as const;
