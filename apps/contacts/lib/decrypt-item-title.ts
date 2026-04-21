import { buildAAD, decrypt, parseEncryptedData } from "@/lib/crypto";

/** Decrypt a single encrypted item title for linking UI. */
export async function decryptItemTitle(
  encryptedTitle: string,
  itemId: string,
  key: CryptoKey
): Promise<string> {
  try {
    const parsed = parseEncryptedData(encryptedTitle);
    return await decrypt(parsed, key, buildAAD("items", itemId));
  } catch {
    return "(encrypted)";
  }
}
