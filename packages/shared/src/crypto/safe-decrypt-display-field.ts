import { buildAAD, decrypt, parseEncryptedData } from "./encryption";

/** Shown when ciphertext cannot be decrypted for UI display (wrong key, corrupt payload). */
const DEFAULT_DISPLAY_FALLBACK = "(encrypted)";

/** Allowed `buildAAD` table names for title/display decryption in E2EE apps. */
export type SafeDecryptDisplayAadTable =
  | "items"
  | "contacts"
  | "notes"
  | "item_contact_links"
  | "user_passkey_params";

/**
 * Decrypt a stored encrypted field for safe UI display; returns a neutral label on failure.
 * Never throws - avoids breaking lists when a single row fails to decrypt.
 */
export async function safeDecryptDisplayField(options: {
  encrypted: string;
  recordId: string;
  key: CryptoKey;
  aadTable: SafeDecryptDisplayAadTable;
  fallback?: string;
}): Promise<string> {
  const {
    encrypted,
    recordId,
    key,
    aadTable,
    fallback = DEFAULT_DISPLAY_FALLBACK,
  } = options;

  try {
    const parsed = parseEncryptedData(encrypted);
    return await decrypt(parsed, key, buildAAD(aadTable, recordId));
  } catch {
    return fallback;
  }
}
