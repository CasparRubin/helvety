import { safeDecryptDisplayField } from "./safe-decrypt-display-field";

/** Decrypt a bookmark name for cross-app linking UI. */
export async function decryptLinkDisplayName(
  encryptedName: string,
  linkId: string,
  key: CryptoKey
): Promise<string> {
  return safeDecryptDisplayField({
    encrypted: encryptedName,
    recordId: linkId,
    key,
    aadTable: "links",
    aadColumn: "encrypted_name",
  });
}

/** Decrypt a bookmark URL for cross-app linking UI. */
export async function decryptLinkDisplayUrl(
  encryptedUrl: string,
  linkId: string,
  key: CryptoKey
): Promise<string> {
  return safeDecryptDisplayField({
    encrypted: encryptedUrl,
    recordId: linkId,
    key,
    aadTable: "links",
    aadColumn: "encrypted_url",
  });
}
