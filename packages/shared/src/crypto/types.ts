/**
 * E2EE Crypto Types
 * TypeScript interfaces for the encryption system
 */

/**
 * Encrypted data structure stored in the database
 */
export interface EncryptedData {
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Encryption format version for future compatibility */
  version: number;
  /** Key version used for encryption. Used for key rotation support.
   *  When rotating keys, increment this value. During decryption,
   *  use this to select the correct key version. Defaults to 1. */
  keyVersion?: number;
}

/**
 * User's PRF-based key parameters stored in the database
 * Used for passkey-based encryption
 */
export interface PRFKeyParams {
  /** Base64-encoded PRF salt for HKDF */
  prfSalt: string;
  /** Version for future compatibility */
  version: number;
}

/**
 * Error types for crypto operations
 */
export enum CryptoErrorType {
  KEY_DERIVATION_FAILED = "KEY_DERIVATION_FAILED",
  ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
  DECRYPTION_FAILED = "DECRYPTION_FAILED",
  KEY_NOT_FOUND = "KEY_NOT_FOUND",
  STORAGE_ERROR = "STORAGE_ERROR",
  PASSKEY_NOT_SUPPORTED = "PASSKEY_NOT_SUPPORTED",
  PRF_NOT_SUPPORTED = "PRF_NOT_SUPPORTED",
  PASSKEY_REGISTRATION_FAILED = "PASSKEY_REGISTRATION_FAILED",
  PASSKEY_AUTHENTICATION_FAILED = "PASSKEY_AUTHENTICATION_FAILED",
}

/**
 * Custom error class for crypto operations
 */
export class CryptoError extends Error {
  constructor(
    public type: CryptoErrorType,
    message: string,
    public override cause?: Error
  ) {
    super(message);
    this.name = "CryptoError";
  }
}
