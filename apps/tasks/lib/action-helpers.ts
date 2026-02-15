import "server-only";

import { getUserWithRetry } from "@helvety/shared/auth-retry";
import { requireCSRFToken } from "@helvety/shared/csrf";
import { createServerClient } from "@helvety/shared/supabase/server";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { SupabaseClient, User } from "@supabase/supabase-js";

// =============================================================================
// Types
// =============================================================================

/** Context provided to server actions after authentication and rate limiting */
export interface AuthContext {
  /** The authenticated user */
  user: User;
  /** Supabase client scoped to the request */
  supabase: SupabaseClient;
}

/** Discriminated union: either auth succeeded or we have an error response.
 *  The failure response is typed as the failure branch of ActionResponse,
 *  which is assignable to any ActionResponse<T>. */
type AuthResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: { success: false; error: string } };

/** Options for the authentication guard */
interface AuthGuardOptions {
  /** CSRF token to validate. Pass `undefined` to skip CSRF validation (read-only actions). */
  csrfToken?: string;
  /** Rate limit key prefix (e.g. "tasks", "labels"). Appends `:user:{userId}` for mutations or `:read:{userId}` for read-only actions. */
  rateLimitPrefix: string;
  /** Rate limit configuration. Defaults to RATE_LIMITS.API. */
  rateLimitConfig?: { maxRequests: number; windowMs: number };
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
 * @example
 * ```ts
 * export async function createUnit(data, csrfToken) {
 *   try {
 *     const auth = await authenticateAndRateLimit({ csrfToken, rateLimitPrefix: "tasks" });
 *     if (!auth.ok) return auth.response;
 *     const { user, supabase } = auth.ctx;
 *     // ... business logic ...
 *   } catch (error) { ... }
 * }
 * ```
 */
export async function authenticateAndRateLimit(
  options: AuthGuardOptions
): Promise<AuthResult> {
  const {
    csrfToken,
    rateLimitPrefix,
    rateLimitConfig = RATE_LIMITS.API,
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

  // 2. Authentication (with retry for transient network failures)
  const supabase = await createServerClient();
  const { user, error: userError } = await getUserWithRetry(supabase);

  if (userError || !user) {
    return {
      ok: false,
      response: { success: false, error: "Not authenticated" },
    };
  }

  // 3. Rate limiting
  if (csrfToken !== undefined) {
    // Mutation rate limit (stricter)
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
          error: `Too many attempts. Please wait ${rateLimit.retryAfter ?? 60} seconds before trying again.`,
        },
      };
    }
  } else {
    // Read-only rate limit (softer, prevents scraping/enumeration)
    const readLimit = await checkRateLimit(
      `${rateLimitPrefix}:read:${user.id}`,
      RATE_LIMITS.READ.maxRequests,
      RATE_LIMITS.READ.windowMs
    );

    if (!readLimit.allowed) {
      return {
        ok: false,
        response: {
          success: false,
          error: `Too many requests. Please wait ${readLimit.retryAfter ?? 60} seconds before trying again.`,
        },
      };
    }
  }

  return { ok: true, ctx: { user, supabase } };
}
