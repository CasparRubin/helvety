import "server-only";

import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { DOMAIN, DEV_PORTS } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import { cookies, headers } from "next/headers";
import { z } from "zod";

import type { ActionResponse } from "@helvety/shared/types/entities";

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

export const RP_NAME = "Helvety";
const CHALLENGE_COOKIE_NAME = "webauthn_challenge";
const CHALLENGE_EXPIRY_MS = 3 * 60 * 1000; // 3 minutes
const PRF_SALT_LENGTH = 32; // PRF salt length in bytes

const StoredChallengeSchema = z.object({
  challenge: z.string().min(1),
  userId: z.string().uuid().optional(),
  expectedUserId: z.string().uuid().optional(),
  expectedEmail: z.string().email().optional(),
  timestamp: z.number().int().nonnegative(),
  redirectUri: z.string().url().optional(),
  prfSalt: z.string().min(1).optional(),
});

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
 * Get client IP for rate limiting
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    getTrustedClientIp(headersList, {
      requireTrustedProxyInProduction: true,
      fallback: "unknown",
    }) ?? "unknown"
  );
}

// =============================================================================
// RELYING PARTY CONFIGURATION
// =============================================================================

/**
 * Get the Relying Party ID
 *
 * IMPORTANT: For centralized auth, we use 'helvety.com' as the rpId in production.
 * This allows passkeys registered on helvety.com/auth to work across all paths.
 *
 * @param origin - The origin URL (used only for development detection)
 */
export function getRpId(origin: string): string {
  try {
    const url = new URL(origin);
    // In development, use localhost
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "localhost";
    }
    // In production topology, use the root domain for passkey sharing across app paths
    return DOMAIN;
  } catch {
    // Fallback to production domain
    return DOMAIN;
  }
}

/**
 * Get expected origins for passkey verification.
 * In production there is a single origin (https://helvety.com) because all
 * apps are served under one domain via path-based routing (multi-zone).
 * In development each app runs on a separate localhost port.
 */
export function getExpectedOrigins(rpId: string): string[] {
  if (rpId === "localhost") {
    // All local development ports for Helvety apps.
    // Support both localhost and 127.0.0.1 because developers often mix both.
    return [
      ...Object.values(DEV_PORTS).map((port) => `http://localhost:${port}`),
      ...Object.values(DEV_PORTS).map((port) => `http://127.0.0.1:${port}`),
    ];
  }
  // All apps served under helvety.com via path-based routing (multi-zone)
  return [`https://${DOMAIN}`];
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

  cookieStore.set(CHALLENGE_COOKIE_NAME, JSON.stringify(challengeData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CHALLENGE_EXPIRY_MS / 1000,
    path: "/",
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
    const parsedJson = JSON.parse(cookie.value);
    const parsed = StoredChallengeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return null;
    }
    const data = parsed.data;

    // Check if challenge has expired
    if (Date.now() - data.timestamp > CHALLENGE_EXPIRY_MS) {
      return null;
    }

    return data as StoredChallenge;
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
// PASSKEY STATUS (internal helper — NOT a server action)
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
