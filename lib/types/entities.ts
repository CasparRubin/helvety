/**
 * Entity type definitions for helvety-store
 * User/auth related types for encryption
 */

// =============================================================================
// ENCRYPTION KEY TYPES
// =============================================================================

/**
 * User's passkey encryption parameters (stored in DB, not secret)
 * Used for PRF-based key derivation from passkeys
 */
export interface UserPasskeyParams {
  user_id: string
  /** Base64-encoded PRF salt for HKDF */
  prf_salt: string
  /** Base64url-encoded credential ID */
  credential_id: string
  /** PRF version for future compatibility */
  version: number
  created_at: string
}

// =============================================================================
// SERVER ACTION TYPES
// =============================================================================

/**
 * Standard response type for server actions
 */
export type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}
