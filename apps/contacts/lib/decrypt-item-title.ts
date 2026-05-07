import { safeDecryptDisplayField } from "@helvety/shared/crypto";

/** Decrypt a single encrypted item title for linking UI. */
export async function decryptItemTitle(
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
