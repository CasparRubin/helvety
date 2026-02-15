import "server-only";

import { DOMAIN, DEV_PORTS } from "@helvety/shared/config";
import { cookies, headers } from "next/headers";
import { z } from "zod";

// =============================================================================
// TYPES
// =============================================================================

/** Challenge data stored in cookie for WebAuthn ceremony verification */
export type StoredChallenge = {
  challenge: string;
  userId?: string; // For authenticated user flows
  timestamp: number;
  redirectUri?: string;
  prfSalt?: string; // PRF salt for encryption (base64 encoded)
};

// =============================================================================
// CONFIGURATION
// =============================================================================

export const RP_NAME = "Helvety";
export const CHALLENGE_COOKIE_NAME = "webauthn_challenge";
export const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
export const PRF_VERSION = 1; // Current PRF encryption version
export const PRF_SALT_LENGTH = 32; // PRF salt length in bytes

const StoredChallengeSchema = z.object({
  challenge: z.string().min(1),
  userId: z.string().uuid().optional(),
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
  // Prefer x-real-ip (set by Vercel from the true client IP, not spoofable)
  // over x-forwarded-for (client-controllable when not behind a trusted proxy)
  return (
    headersList.get("x-real-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
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
    // In production, always use the root domain for passkey sharing across all apps
    return DOMAIN;
  } catch {
    // Fallback to production domain
    return DOMAIN;
  }
}

/**
 * Get expected origins for verification
 * Includes all Helvety origins for passkey verification
 */
export function getExpectedOrigins(rpId: string): string[] {
  if (rpId === "localhost") {
    // All local development ports for Helvety apps
    return [
      "http://localhost:3000",
      ...Object.values(DEV_PORTS).map((port) => `http://localhost:${port}`),
    ];
  }
  // All apps served under helvety.com via path-based routing (multi-zone)
  return [`https://${DOMAIN}`];
}

// =============================================================================
// CHALLENGE STORAGE (using cookies)
// =============================================================================

/**
 * Store challenge in a secure httpOnly cookie
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
    sameSite: "lax", // Allow cross-site for redirects
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
