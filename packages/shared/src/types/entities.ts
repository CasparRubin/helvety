/**
 * Entity type definitions shared across Helvety web apps in this monorepo.
 * These types represent database entities (source of truth in @helvety/shared).
 */

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

/**
 * User's WebAuthn authentication credential (stored in DB)
 * Used for passkey-based passwordless authentication
 */
export interface UserAuthCredential {
  id: string;
  user_id: string;
  /** Base64url-encoded credential ID from WebAuthn */
  credential_id: string;
  /** Base64url-encoded COSE public key for signature verification */
  public_key: string;
  /** Signature counter to detect cloned credentials */
  counter: number;
  /** Transport hints for credential (e.g., ['hybrid']) */
  transports: string[];
  /** Device type: 'singleDevice' (hardware key) or 'multiDevice' (synced passkey) */
  device_type: string | null;
  /** Whether the credential is cloud-synced */
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

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
  /** Key check value for validating derived keys (JSON-encoded KCV) */
  key_check_value?: string | null;
  created_at: string;
}

// =============================================================================
// USER PROFILE TYPES
// =============================================================================

/**
 * User profile (central identity across helvety.com web apps that share this backend).
 * Persisted columns match `user_profiles` in the hosted Supabase schema.
 */
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// SERVER ACTION TYPES
// =============================================================================

/**
 * Standard response type for server actions (discriminated union).
 *
 * Success branch includes `data` (unless T is void).
 * Failure branch includes `error` string.
 * TypeScript narrows on `success` so consumers must check before accessing
 * `data` or `error`.
 */
export type ActionResponse<T = void> = [T] extends [void]
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string };
