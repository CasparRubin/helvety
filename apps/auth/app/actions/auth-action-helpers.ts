import "server-only";

import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { COOKIE_DOMAIN } from "@helvety/shared/config";
import {
  signCookiePayload,
  verifySignedCookiePayload,
} from "@helvety/shared/cookie-signing";
import { requireCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import { cookies, headers } from "next/headers";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import { WEBAUTHN_CHALLENGE_EXPIRY_MS } from "@/lib/webauthn-challenge-ttl";

import type { RateLimitPolicy } from "@helvety/shared/rate-limit";
import type { ActionResponse } from "@helvety/shared/types/entities";

export { getExpectedOrigins, getRpId, RP_NAME } from "./auth-rp-config";

// =============================================================================
// TYPES
// =============================================================================

/** Challenge data stored in cookie for WebAuthn ceremony verification */
type StoredChallenge = {
  challenge: string;
  userId?: string; // For authenticated user flows
  expectedUserId?: string; // For strict account-bound passkey sign-in flows
  expectedEmail?: string; // Normalized email tied to the expected credential owner
  timestamp: number;
  redirectUri?: string;
  prfSalt?: string; // PRF salt for encryption (base64 encoded)
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const CHALLENGE_COOKIE_NAME = "webauthn_challenge";
const CHALLENGE_EXPIRY_MS = WEBAUTHN_CHALLENGE_EXPIRY_MS;
const PRF_SALT_LENGTH = 32; // PRF salt length in bytes

const StoredChallengeSchema = z.object({
  challenge: z.string().min(1),
  userId: z.uuid().optional(),
  expectedUserId: z.uuid().optional(),
  expectedEmail: z.email().optional(),
  timestamp: z.number().int().nonnegative(),
  redirectUri: z.url().optional(),
  prfSalt: z.string().min(1).optional(),
});

export const NormalizedEmailSchema = z
  .string()
  .trim()
  .pipe(z.email())
  .transform((value) => value.toLowerCase());

export const OriginUrlSchema = z.url().refine((value) => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") return true;
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}, "Invalid origin URL");

/** Config for a single rate-limit guard check. */
type AuthActionRateLimitOptions = {
  key: string;
  maxRequests: number;
  windowMs: number;
  prefix?: string;
  policy?: RateLimitPolicy;
  message?: (retryAfterSeconds: number) => string;
};

/** Options for shared auth-action guard execution. */
type AuthActionGuardOptions = {
  csrfToken: string;
  requireClientIP?: boolean;
  missingIpError?: string;
  securityError?: string;
  rateLimit?: AuthActionRateLimitOptions;
};

/** Discriminated result returned by auth-action guard execution. */
type AuthActionGuardResult =
  | { ok: true; clientIP: string | null }
  | { ok: false; response: { success: false; error: string } };

/** Discriminated result returned by rate-limit guard execution. */
type RateLimitGuardResult =
  | { ok: true }
  | {
      ok: false;
      response: { success: false; error: string };
      retryAfter: number;
    };

/**
 * Generate a random PRF salt for encryption
 */
export function generatePRFSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(PRF_SALT_LENGTH));
  return Buffer.from(salt).toString("base64");
}

// =============================================================================
// NETWORK UTILITIES
// =============================================================================

/**
 * Get client IP for rate limiting.
 * Returns null when IP cannot be resolved (callers must fail closed).
 */
async function getClientIP(): Promise<string | null> {
  const headersList = await headers();
  return getTrustedClientIp(headersList, {
    requireTrustedProxyInProduction: true,
  });
}

/**
 * Shared auth-action guard for CSRF, trusted IP resolution, and optional
 * rate limiting. Returns a typed early-exit response on guard failures.
 */
export async function runAuthActionGuards(
  options: AuthActionGuardOptions
): Promise<AuthActionGuardResult> {
  const {
    csrfToken,
    requireClientIP = true,
    missingIpError = "Unable to process request. Please try again.",
    securityError = "Security validation failed. Please sign in again.",
    rateLimit,
  } = options;

  try {
    await requireCSRFToken(csrfToken);
  } catch {
    return {
      ok: false,
      response: {
        success: false,
        error: securityError,
      },
    };
  }

  const clientIP = requireClientIP ? await getClientIP() : null;
  if (requireClientIP && !clientIP) {
    return {
      ok: false,
      response: {
        success: false,
        error: missingIpError,
      },
    };
  }

  if (rateLimit) {
    const result = await checkRateLimit(
      rateLimit.key,
      rateLimit.maxRequests,
      rateLimit.windowMs,
      rateLimit.prefix,
      rateLimit.policy
    );
    if (!result.allowed) {
      const retryAfter = result.retryAfter ?? 60;
      return {
        ok: false,
        response: {
          success: false,
          error:
            rateLimit.message?.(retryAfter) ??
            buildRateLimitedUserMessage(retryAfter),
        },
      };
    }
  }

  return { ok: true, clientIP };
}

/**
 * Run one rate-limit check and return an early-exit typed failure response.
 */
export async function runRateLimitGuard(
  options: AuthActionRateLimitOptions
): Promise<RateLimitGuardResult> {
  const result = await checkRateLimit(
    options.key,
    options.maxRequests,
    options.windowMs,
    options.prefix,
    options.policy
  );
  if (result.allowed) {
    return { ok: true };
  }

  const retryAfter = result.retryAfter ?? 60;
  return {
    ok: false,
    retryAfter,
    response: {
      success: false,
      error:
        options.message?.(retryAfter) ??
        buildRateLimitedUserMessage(retryAfter),
    },
  };
}

// =============================================================================
// CHALLENGE STORAGE (using cookies)
// =============================================================================

/**
 * Store challenge in an HttpOnly cookie (Secure in production)
 */
export async function storeChallenge(
  data: Omit<StoredChallenge, "timestamp">
): Promise<void> {
  const cookieStore = await cookies();
  const challengeData: StoredChallenge = {
    ...data,
    timestamp: Date.now(),
  };
  const signedChallenge = await signCookiePayload(
    JSON.stringify(challengeData)
  );

  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set(CHALLENGE_COOKIE_NAME, signedChallenge, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: CHALLENGE_EXPIRY_MS / 1000,
    path: "/",
    ...(isProduction && COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
}

/**
 * Retrieve and validate stored challenge
 */
export async function getStoredChallenge(): Promise<StoredChallenge | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CHALLENGE_COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  try {
    const unsignedPayload = await verifySignedCookiePayload(cookie.value);
    if (!unsignedPayload) {
      return null;
    }
    const parsedJson = JSON.parse(unsignedPayload);
    const parsed = StoredChallengeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return null;
    }
    const data = parsed.data;

    // Check if challenge has expired
    if (Date.now() - data.timestamp > CHALLENGE_EXPIRY_MS) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear the stored challenge
 */
export async function clearChallenge(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
}

// =============================================================================
// PASSKEY STATUS (internal helper - NOT a server action)
// =============================================================================

/**
 * Check if a user has any passkey credentials registered.
 *
 * This helper is intentionally not exposed as a server action. Keep explicit
 * authz checks at call sites to prevent arbitrary userId enumeration.
 */
export async function checkUserPasskeyStatus(
  userId: string
): Promise<ActionResponse<{ hasPasskey: boolean; count: number }>> {
  try {
    const scopedAdmin = createScopedAdminQuery(userId);

    const { data, error, count } = await scopedAdmin
      .from("user_auth_credentials")
      .select("id", { count: "exact" });

    if (error) {
      logger.logUnexpectedError("Error checking passkey status", error);
      return { success: false, error: "Failed to check passkey status" };
    }

    const credentialCount = count ?? data?.length ?? 0;

    return {
      success: true,
      data: {
        hasPasskey: credentialCount > 0,
        count: credentialCount,
      },
    };
  } catch (error) {
    logger.logUnexpectedError("Error in checkUserPasskeyStatus", error);
    return { success: false, error: "Failed to check passkey status" };
  }
}
