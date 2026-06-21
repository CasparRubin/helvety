import "server-only";

import {
  decodeDeviceTrustCookieValue,
  encodeDeviceTrustCookieValue,
} from "./device-trust-cookie";

import type { WeeklyProofPayload } from "./weekly-proof-token";

/**
 * Mints an HMAC-signed weekly email re-proof for the Chromium extension.
 * Uses the same secret and payload schema as {@link helvety_device_trust}.
 */
export function mintExtensionWeeklyProof(userId: string): string {
  return encodeDeviceTrustCookieValue(userId);
}

/**
 * Verifies a weekly proof token (full HMAC + expiry) and ensures it matches the user.
 */
export function verifyExtensionWeeklyProof(
  token: string,
  userId: string
): WeeklyProofPayload | null {
  const payload = decodeDeviceTrustCookieValue(token);
  if (payload?.userId !== userId) {
    return null;
  }
  return payload;
}
