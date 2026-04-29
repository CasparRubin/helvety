/**
 * E2EE Crypto Module - Public API for the Tasks app.
 *
 * End-to-end encryption runs client-side; plaintext is not intentionally sent
 * to the server. Passkey (PRF) setup is handled by helvety.com/auth.
 */

export {
  EncryptionProvider,
  useEncryptionContext,
} from "@helvety/shared/crypto/encryption-context";

export { buildAAD, decrypt, parseEncryptedData } from "./encryption";

export {
  decryptItemRow,
  decryptItemRows,
  encryptItemInput,
  encryptItemUpdate,
} from "./task-encryption";
