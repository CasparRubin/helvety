/**
 * E2EE Crypto Module - Public API for the Contacts app.
 *
 * End-to-end encryption runs client-side; plaintext is not intentionally sent
 * to the server. Passkey (PRF) setup is handled by helvety.com/auth.
 */

export {
  EncryptionProvider,
  useEncryptionContext,
} from "@helvety/shared/crypto/encryption-context";

export {
  encryptContactInput,
  encryptContactUpdate,
  decryptContactRow,
  decryptContactRows,
} from "./contact-encryption";
