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
  encryptBinary,
  decryptBinary,
  buildAAD,
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
} from "./passkey";
export type { RPConfig, PasskeyAuthenticationResult } from "./passkey";

// Task-specific Encryption (helvety-tasks only)
export {
  // Unit encryption
  encryptUnitInput,
  encryptUnitUpdate,
  decryptUnitRow,
  decryptUnitRows,
  // Space encryption
  encryptSpaceInput,
  encryptSpaceUpdate,
  decryptSpaceRow,
  decryptSpaceRows,
  // Item encryption
  encryptItemInput,
  encryptItemUpdate,
  decryptItemRow,
  decryptItemRows,
  // StageConfig encryption
  encryptStageConfigInput,
  encryptStageConfigUpdate,
  decryptStageConfigRow,
  decryptStageConfigRows,
  // Stage encryption
  encryptStageInput,
  encryptStageUpdate,
  decryptStageRow,
  decryptStageRows,
  // LabelConfig encryption
  encryptLabelConfigInput,
  encryptLabelConfigUpdate,
  decryptLabelConfigRow,
  decryptLabelConfigRows,
  // Label encryption
  encryptLabelInput,
  encryptLabelUpdate,
  decryptLabelRow,
  decryptLabelRows,
  // Attachment encryption
  encryptAttachmentMetadata,
  decryptAttachmentRow,
  decryptAttachmentRows,
  // Contact decryption (read-only)
  decryptContactRow,
  decryptContactRows,
} from "./task-encryption";
