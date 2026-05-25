/**
 * Vault encryption and encryption context re-exports for the Docs app.
 */

export {
  EncryptionProvider,
  useEncryptionContext,
} from "@helvety/shared/crypto/encryption-context";

export {
  decryptDocListItems,
  decryptDocRow,
  encryptDocInput,
  encryptDocUpdate,
} from "./doc-encryption";
