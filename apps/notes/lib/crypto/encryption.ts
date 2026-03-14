/**
 * Re-export shared crypto primitives to keep app crypto behavior consistent
 * across Tasks/Contacts/Notes and avoid drift.
 */
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
