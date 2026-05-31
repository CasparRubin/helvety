/**
 * Base64 encoding/decoding utilities for crypto operations
 * Uses standard base64 encoding (btoa/atob)
 */

/**
 * Encode a Uint8Array to base64 string
 */
export function base64Encode(data: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]!);
  }
  // Use btoa for base64 encoding
  return btoa(binary);
}

/**
 * Decode a base64 string to Uint8Array
 */
export function base64Decode(base64: string): Uint8Array<ArrayBuffer> {
  // Use atob for base64 decoding
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random salt
 * @param length - Length in bytes (default: 16)
 */
export function generateSalt(length: number = 16): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(length);
  const bytes = new Uint8Array(buffer);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a random IV for AES-GCM (12 bytes as recommended by NIST)
 *
 * Security note on IV reuse bounds:
 * With a 96-bit random IV, the birthday bound is ~2^48 encryptions per key
 * before a collision becomes probable (at probability ~2^-32). Given that:
 * - Master keys may be cached in IndexedDB per vault-session policy (24h sliding
 *   idle, 7d max per unlock; see auth-session-policy.ts and key-storage.ts) and are
 *   re-derived from passkey PRF + salt when the cache expires or is cleared
 * - Typical usage is expected to remain well under 1 million encryptions per
 *   key lifetime (operational estimate, not a hard runtime cap)
 * - Each user has their own key (no key sharing between users)
 * The collision probability is negligibly small (~2^-56 for 10^6 operations).
 * Under these assumptions, collision risk remains very low.
 */
export function generateIV(): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(12);
  const bytes = new Uint8Array(buffer);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Compare two Uint8Arrays using constant-time byte comparison when lengths
 * match. Returns early on length mismatch.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}
