/**
 * E2EE Crypto Module - Public API
 *
 * This module provides end-to-end encryption for user content.
 * All encryption/decryption happens client-side; the server never sees plaintext content.
 *
 * Uses passkey-based (PRF) key derivation for secure, passwordless encryption.
 * Setup is handled by auth.helvety.com - this module only handles unlock and usage.
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
} from "@helvety/shared/crypto/key-storage";

// Encoding Utilities
export {
  base64Encode,
  base64Decode,
  generateSalt,
  generateIV,
} from "@helvety/shared/crypto/encoding";

// Context
export { EncryptionProvider, useEncryptionContext } from "@helvety/shared/crypto/encryption-context";

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

// Passkey Operations (Authentication only - setup is in auth.helvety.com)
export {
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
  getRPConfig,
  generateAuthenticationOptions,
  authenticateWithPasskey,
  authenticatePasskeyWithEncryption,
  isPRFSupported as isPasskeyPRFSupported,
  getPRFSupportInfo as getPasskeyPRFSupportInfo,
} from "@helvety/shared/crypto/passkey";
export type { RPConfig, PasskeyAuthenticationResult } from "@helvety/shared/crypto/passkey";
