import { safeDecryptDisplayField } from "./safe-decrypt-display-field";

/** Decrypt a single encrypted note title for cross-app linking UI. */
export async function decryptNoteDisplayTitle(
  encryptedTitle: string,
  noteId: string,
  key: CryptoKey
): Promise<string> {
  return safeDecryptDisplayField({
    encrypted: encryptedTitle,
    recordId: noteId,
    key,
    aadTable: "notes",
    aadColumn: "encrypted_title",
  });
}
