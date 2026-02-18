/**
 * Key Check Value (KCV) Module
 *
 * Generates and verifies a key check value to detect when a wrong encryption
 * key has been derived (e.g., from a different account's passkey). Without
 * this check, a wrong key would silently produce garbled data and corrupt
 * newly created records.
 *
 * The KCV is an AES-GCM encryption of a known constant with the master key.
 * On unlock, the KCV is decrypted and the plaintext is compared to the
 * expected constant. A mismatch means the wrong key was derived.
 */

import { constantTimeEqual } from "./encoding";

const KCV_PLAINTEXT = "helvety-kcv-v1";
const KCV_VERSION = 1;

interface KeyCheckData {
  iv: string;
  ciphertext: string;
  version: number;
}

/**
 * Generate a key check value by encrypting a known constant with the master key.
 * Store the returned string in the database alongside the passkey params.
 */
export async function generateKeyCheckValue(
  masterKey: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(KCV_PLAINTEXT);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    plaintext
  );

  const data: KeyCheckData = {
    iv: uint8ToBase64(iv),
    ciphertext: uint8ToBase64(new Uint8Array(ciphertext)),
    version: KCV_VERSION,
  };

  return JSON.stringify(data);
}

/**
 * Verify a derived master key against a stored key check value.
 * Returns true if the key is correct, false if it's wrong.
 */
export async function verifyKeyCheckValue(
  masterKey: CryptoKey,
  kcvString: string
): Promise<boolean> {
  try {
    const data: KeyCheckData = JSON.parse(kcvString);
    const iv = base64ToUint8(data.iv);
    const ciphertext = base64ToUint8(data.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      masterKey,
      ciphertext.buffer as ArrayBuffer
    );

    const expected = new TextEncoder().encode(KCV_PLAINTEXT);
    const actual = new Uint8Array(decrypted);
    return constantTimeEqual(actual, expected);
  } catch {
    // Decryption failure (wrong key produces authentication tag mismatch)
    return false;
  }
}

function uint8ToBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

function base64ToUint8(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
