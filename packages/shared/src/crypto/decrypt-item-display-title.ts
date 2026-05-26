import { safeDecryptDisplayField } from "./safe-decrypt-display-field";

/** Decrypt a single encrypted item title for cross-app linking UI. */
export async function decryptItemDisplayTitle(
  encryptedTitle: string,
  itemId: string,
  key: CryptoKey
): Promise<string> {
  return safeDecryptDisplayField({
    encrypted: encryptedTitle,
    recordId: itemId,
    key,
    aadTable: "items",
  });
}
