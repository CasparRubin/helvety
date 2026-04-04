/**
 * Re-export shared crypto primitives used by the Notes app.
 */
export {
  buildAAD,
  decrypt,
  encrypt,
  parseEncryptedData,
  serializeEncryptedData,
} from "@helvety/shared/crypto/encryption";
