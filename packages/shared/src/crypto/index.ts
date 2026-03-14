/**
 * E2EE Crypto Module - Public API
 *
 * This module provides end-to-end encryption for user content in Helvety
 * Tasks, Helvety Contacts, and Helvety Notes. All encryption/decryption is
 * designed to happen client-side; plaintext should not be intentionally sent
 * to the server.
 *
 * Uses passkey-based (PRF) key derivation for passwordless client-side
 * encryption workflows.
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
  onKeyEvent,
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
  isPRFSupported as isPasskeyPRFSupported,
  getPRFSupportInfo as getPasskeyPRFSupportInfo,
} from "./passkey";
