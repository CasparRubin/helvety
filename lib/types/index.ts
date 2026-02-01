/**
 * Type definitions for helvety.com
 *
 * This module re-exports all types used throughout the application.
 * Project-specific types can be added here as the application grows.
 */

// =============================================================================
// CRYPTO TYPES
// =============================================================================
export type {
  EncryptedData,
  PRFKeyParams,
  StoredPasskey,
  WrappedKey,
  StoredKeyEntry,
} from "@/lib/crypto/types";

export { CryptoErrorType, CryptoError } from "@/lib/crypto/types";

// =============================================================================
// ENCRYPTION KEY TYPES
// =============================================================================

/**
 * User's passkey encryption parameters (stored in DB, not secret)
 * Used for PRF-based key derivation from passkeys
 */
export interface UserPasskeyParams {
  user_id: string;
  /** Base64-encoded PRF salt for HKDF */
  prf_salt: string;
  /** Base64url-encoded credential ID */
  credential_id: string;
  /** PRF version for future compatibility */
  version: number;
  created_at: string;
}
