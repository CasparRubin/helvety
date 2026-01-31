/**
 * Crypto Types for Helvety PDF
 * TypeScript interfaces for the authentication system
 */

/**
 * Error types for crypto operations
 */
export enum CryptoErrorType {
  KEY_DERIVATION_FAILED = "KEY_DERIVATION_FAILED",
  ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
  DECRYPTION_FAILED = "DECRYPTION_FAILED",
  KEY_NOT_FOUND = "KEY_NOT_FOUND",
  STORAGE_ERROR = "STORAGE_ERROR",
  KEY_WRAP_FAILED = "KEY_WRAP_FAILED",
  KEY_UNWRAP_FAILED = "KEY_UNWRAP_FAILED",
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
