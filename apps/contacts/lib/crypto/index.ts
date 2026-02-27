/**
 * E2EE Crypto Module - Public API
 *
 * This module provides end-to-end encryption for user content.
 * Encryption/decryption is designed to happen client-side; plaintext should
 * not be intentionally sent to the server.
 *
 * Uses passkey-based (PRF) key derivation for secure, passwordless encryption.
 * Setup is handled by helvety.com/auth - this module only handles unlock and usage.
 */

// Types
export type {
  EncryptedData,
  PRFKeyParams,
  StoredPasskey,
  WrappedKey,
  StoredKeyEntry,
} from "@helvety/shared/crypto/types";

export { CryptoError, CryptoErrorType } from "@helvety/shared/crypto/types";

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
  buildAAD,
} from "@helvety/shared/crypto/encryption";

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
} from "@helvety/shared/crypto/key-storage";

// Encoding Utilities
export {
  base64Encode,
  base64Decode,
  generateSalt,
  generateIV,
} from "@helvety/shared/crypto/encoding";

// Context
export {
  EncryptionProvider,
  useEncryptionContext,
} from "@helvety/shared/crypto/encryption-context";

// Contact Encryption Helpers
export {
  encryptContactInput,
  decryptContactRow,
  decryptContactRows,
  encryptContactUpdate,
  encryptCategoryConfigInput,
  decryptCategoryConfigRow,
  decryptCategoryConfigRows,
  encryptCategoryConfigUpdate,
  encryptCategoryInput,
  decryptCategoryRow,
  decryptCategoryRows,
  encryptCategoryUpdate,
} from "./contact-encryption";

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
} from "@helvety/shared/crypto/prf-key-derivation";
export type {
  PRFKeyParams as PRFKeyParamsType,
  PRFSupportInfo,
} from "@helvety/shared/crypto/prf-key-derivation";
