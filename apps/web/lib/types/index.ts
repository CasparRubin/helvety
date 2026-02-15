/**
 * Type definitions for helvety.com
 *
 * This module re-exports all types used throughout the application.
 * Project-specific types can be added here as the application grows.
 */

// =============================================================================
// SHARED ENTITY TYPES
// =============================================================================
export type {
  UserAuthCredential,
  UserPasskeyParams,
  UserProfile,
  ActionResponse,
} from "./entities";

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
