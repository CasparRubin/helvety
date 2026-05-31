/**
 * E2EE Crypto Module - Public API
 *
 * This module provides end-to-end encryption for user content in Helvety
 * Tasks, Helvety Contacts, Helvety Notes, and Helvety Links. All encryption/decryption is
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
  getCachedMasterKey,
  deleteMasterKey,
  clearAllKeys,
  isStorageAvailable,
  onKeyEvent,
  touchVaultSessionInStorage,
} from "./key-storage";
export type { CachedMasterKey } from "./key-storage";

// Vault session policy (IndexedDB master-key retention)
export {
  VAULT_SLIDING_IDLE_MS,
  VAULT_MAX_LIFETIME_MS,
  createVaultSession,
  touchVaultSession,
  isVaultSessionValid,
  isVaultMaxLifetimeExceeded,
  getVaultLockDelayMs,
  normalizeVaultSessionTimestamps,
} from "./vault-session";
export type { VaultSessionTimestamps } from "./vault-session";

// Encoding Utilities
export {
  base64Encode,
  base64Decode,
  generateSalt,
  generateIV,
} from "./encoding";

// Context
export { EncryptionProvider, useEncryptionContext } from "./encryption-context";
export { useVaultIdleLock } from "./use-vault-idle-lock";
export type { UseVaultIdleLockOptions } from "./use-vault-idle-lock";

export {
  AUTH_SLIDING_IDLE_MS,
  AUTH_MAX_LIFETIME_MS,
  AUTH_MAX_LIFETIME_SECONDS,
} from "../auth-session-policy";

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

// Passkey capability helpers (setup/auth flows live in apps/auth)
export { isPasskeySupported } from "./passkey";

// Safe UI display decryption (neutral fallback on failure)
export {
  safeDecryptDisplayField,
  type SafeDecryptDisplayAadTable,
} from "./safe-decrypt-display-field";

export { decryptItemDisplayTitle } from "./decrypt-item-display-title";
export { decryptNoteDisplayTitle } from "./decrypt-note-display-title";
