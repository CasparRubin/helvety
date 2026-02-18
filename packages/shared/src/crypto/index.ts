/**
 * E2EE Crypto Module - Public API
 *
 * This module provides end-to-end encryption for user content in Helvety Tasks
 * and Helvety Contacts. All encryption/decryption happens client-side; the
 * server never sees plaintext content.
 *
 * Uses passkey-based (PRF) key derivation for secure, passwordless encryption.
 * Encryption setup is handled by helvety.com/auth.
 */

// Types
export type {
  EncryptedData,
  PRFKeyParams,
  StoredPasskey,
  WrappedKey,
  StoredKeyEntry,
} from "./types";

export { CryptoError, CryptoErrorType } from "./types";

// Encryption
export {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  serializeEncryptedData,
  parseEncryptedData,
  isEncryptedData,
  encryptFields,
  decryptFields,
} from "./encryption";

// Key Storage
export {
  storeMasterKey,
  getMasterKey,
  deleteMasterKey,
  storeUnitKey,
  getUnitKey,
  deleteUnitKey,
  clearAllKeys,
  isStorageAvailable,
} from "./key-storage";

// Encoding Utilities
export {
  base64Encode,
  base64Decode,
  generateSalt,
  generateIV,
} from "./encoding";

// Context
export { EncryptionProvider, useEncryptionContext } from "./encryption-context";

// PRF Key Derivation (Passkey-based)
export {
  generatePRFParams,
  getPRFSaltBytes,
  deriveKeyFromPRF,
  initializePRFEncryption,
  unlockPRFEncryption,
  isPRFSupported,
  getPRFSupportInfo,
  PRF_VERSION,
} from "./prf-key-derivation";
export type {
  PRFKeyParams as PRFKeyParamsType,
  PRFSupportInfo,
} from "./prf-key-derivation";

// Key Check Value (defense-in-depth against wrong-key derivation)
export { generateKeyCheckValue, verifyKeyCheckValue } from "./key-check";

// PRF Salt Cache (for single-touch login + encryption unlock)
export {
  cachePRFSalt,
  getCachedPRFSalt,
  clearCachedPRFSalt,
} from "./prf-salt-cache";

// Passkey Operations (Authentication only - setup is in helvety.com/auth)
export {
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
  getRPConfig,
  generateAuthenticationOptions,
  authenticateWithPasskey,
  authenticatePasskeyWithEncryption,
  isPRFSupported as isPasskeyPRFSupported,
  getPRFSupportInfo as getPasskeyPRFSupportInfo,
} from "./passkey";
export type { RPConfig, PasskeyAuthenticationResult } from "./passkey";
