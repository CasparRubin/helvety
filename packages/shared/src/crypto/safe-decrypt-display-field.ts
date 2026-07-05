import { decryptEntityField, parseEncryptedData } from "./encryption";

/** Shown when ciphertext cannot be decrypted for UI display (wrong key, corrupt payload). */
const DEFAULT_DISPLAY_FALLBACK = "(encrypted)";

/** Allowed entity tables for title/display decryption in E2EE apps. */
export type SafeDecryptDisplayAadTable =
  | "items"
  | "contacts"
  | "notes"
  | "link_folders"
  | "links"
  | "item_contact_links";

/**
 * Decrypt a stored encrypted field for safe UI display; returns a neutral label on failure.
 * Never throws - avoids breaking lists when a single row fails to decrypt.
 */
export async function safeDecryptDisplayField(options: {
  encrypted: string;
  recordId: string;
  key: CryptoKey;
  aadTable: SafeDecryptDisplayAadTable;
  aadColumn: string;
  fallback?: string;
}): Promise<string> {
  const {
    encrypted,
    recordId,
    key,
    aadTable,
    aadColumn,
    fallback = DEFAULT_DISPLAY_FALLBACK,
  } = options;

  try {
    const parsed = parseEncryptedData(encrypted);
    return await decryptEntityField(parsed, key, {
      table: aadTable,
      recordId,
      column: aadColumn,
    });
  } catch {
    return fallback;
  }
}
