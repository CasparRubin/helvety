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
 * expected constant. A verification failure indicates either a wrong derived
 * key or invalid/corrupted KCV data.
 */

import { constantTimeEqual } from "./encoding";

import type { SupabaseClient } from "@supabase/supabase-js";

const KCV_PLAINTEXT = "helvety-kcv-v1";
const KCV_VERSION = 1;

/** Serialized KCV structure stored in the database */
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
 * Returns true on successful verification; false if verification fails.
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
    // Covers malformed KCV payloads and decryption/auth-tag failures.
    return false;
  }
}

/** Encode a Uint8Array to a standard base64 string. */
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

/** Decode a standard base64 string to a Uint8Array. */
function base64ToUint8(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Backfill `key_check_value` when missing (client-side PostgREST update).
 * Used by extension passkey unlock and auth login bootstrap.
 */
export async function backfillKeyCheckValueIfMissing(
  supabase: SupabaseClient,
  userId: string,
  masterKey: CryptoKey
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const newKeyCheckValue = await generateKeyCheckValue(masterKey);
    const { error } = await supabase
      .from("user_passkey_params")
      .update({ key_check_value: newKeyCheckValue })
      .eq("user_id", userId)
      .is("key_check_value", null);

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to backfill key check value";
    return { ok: false, message };
  }
}
