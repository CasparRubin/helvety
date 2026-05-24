import "server-only";

import {
  buildAuthHardLogoutError,
  buildAuthRequiredError,
  shouldForceHardLogout,
} from "./auth-errors";
import { getAuthUser } from "./auth-retry";
import { requireCSRFToken } from "./csrf";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import { createServerClient } from "./supabase/server";
import { buildRateLimitedUserMessage } from "./user-facing-errors";

import type { SupabaseClient, User } from "@supabase/supabase-js";

// =============================================================================
// Types
// =============================================================================

/** Context provided to server actions after authentication and rate limiting */
interface AuthContext {
  /** The authenticated user */
  user: User;
  /** Supabase client scoped to the request */
  supabase: SupabaseClient;
}

/**
 * Discriminated union: either auth succeeded or we have an error response.
 * The failure response is typed as the failure branch of ActionResponse,
 * which is assignable to any ActionResponse<T>.
 */
type AuthResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: { success: false; error: string } };

/** Rate limit thresholds for use with `rateLimitConfig` / `readRateLimitConfig` */
interface RateLimitThresholds {
  maxRequests: number;
  windowMs: number;
}

/** Options for the authentication guard */
interface AuthGuardOptions {
  /** CSRF token to validate. Pass `undefined` to skip CSRF validation (read-only actions). */
  csrfToken?: string;
  /** Rate limit key prefix (e.g. "tasks", "contacts", "store"). Appends `:user:{userId}` for mutations or `:read:{userId}` for read-only actions. */
  rateLimitPrefix: string;
  /** Mutation rate limit configuration (when `csrfToken` is provided). Defaults to RATE_LIMITS.API. */
  rateLimitConfig?: RateLimitThresholds;
  /** Read-only rate limit configuration (when `csrfToken` is `undefined`). Defaults to RATE_LIMITS.READ. */
  readRateLimitConfig?: RateLimitThresholds;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Authentication and rate-limiting guard for server actions.
 *
 * Handles CSRF validation, user authentication, and rate limiting in a single
 * call, eliminating the ~15 lines of boilerplate that was repeated in every
 * server action.
 *
 * **CSRF:** When `csrfToken` is passed, it is validated and the mutation rate
 * bucket applies (`rateLimitConfig`, default `RATE_LIMITS.API`). When
 * `csrfToken` is omitted (read-only actions), CSRF is skipped; the read bucket
 * applies (`readRateLimitConfig`, default `RATE_LIMITS.READ`). Encrypted bulk
 * export actions should pass `readRateLimitConfig: RATE_LIMITS.EXPORT`.
 * Encrypted dashboard prefetch GET routes should use
 * `encryptedPrefetchAuthOptions` from `@helvety/shared/encrypted-prefetch-api`
 * (`RATE_LIMITS.PREFETCH`).
 *
 * @example Mutation (CSRF + per-user API limits)
 * ```ts
 * export async function createItem(data, csrfToken) {
 *   try {
 *     const auth = await authenticateAndRateLimit({ csrfToken, rateLimitPrefix: "tasks" });
 *     if (!auth.ok) return auth.response;
 *     const { user, supabase } = auth.ctx;
 *     // ... business logic ...
 *   } catch (error) { ... }
 * }
 * ```
 *
 * @example Read-only (session + read limits; no CSRF)
 * ```ts
 * const auth = await authenticateAndRateLimit({
 *   rateLimitPrefix: "export",
 *   readRateLimitConfig: RATE_LIMITS.EXPORT,
 * });
 * ```
 */
export async function authenticateAndRateLimit(
  options: AuthGuardOptions
): Promise<AuthResult> {
  const {
    csrfToken,
    rateLimitPrefix,
    rateLimitConfig = RATE_LIMITS.API,
    readRateLimitConfig = RATE_LIMITS.READ,
  } = options;

  // 1. CSRF validation (skip for read-only actions that don't pass a token)
  if (csrfToken !== undefined) {
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        ok: false,
        response: {
          success: false,
          error: "Security validation failed. Please refresh and try again.",
        },
      };
    }
  }

  // 2. Authentication (single check, fail-closed)
  const supabase = await createServerClient();
  const { user, error: userError } = await getAuthUser(supabase);

  if (userError || !user) {
    const errorMessage = userError?.message;
    return {
      ok: false,
      response: {
        success: false,
        error: shouldForceHardLogout(errorMessage)
          ? buildAuthHardLogoutError(errorMessage)
          : buildAuthRequiredError(errorMessage ?? undefined),
      },
    };
  }

  // 3. Rate limiting
  if (csrfToken !== undefined) {
    const rateLimit = await checkRateLimit(
      `${rateLimitPrefix}:user:${user.id}`,
      rateLimitConfig.maxRequests,
      rateLimitConfig.windowMs
    );

    if (!rateLimit.allowed) {
      return {
        ok: false,
        response: {
          success: false,
          error: buildRateLimitedUserMessage(rateLimit.retryAfter),
        },
      };
    }
  } else {
    const readLimit = await checkRateLimit(
      `${rateLimitPrefix}:read:${user.id}`,
      readRateLimitConfig.maxRequests,
      readRateLimitConfig.windowMs
    );

    if (!readLimit.allowed) {
      return {
        ok: false,
        response: {
          success: false,
          error: buildRateLimitedUserMessage(readLimit.retryAfter),
        },
      };
    }
  }

  return { ok: true, ctx: { user, supabase } };
}
