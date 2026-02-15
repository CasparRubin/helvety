/**
 * Encryption Module
 * AES-256-GCM encryption and decryption for user content
 */

import { base64Encode, base64Decode, generateIV } from "@helvety/shared/crypto/encoding";
import { CryptoError, CryptoErrorType } from "@helvety/shared/crypto/types";

import type { EncryptedData } from "@helvety/shared/crypto/types";

/** Current encryption format version */
const ENCRYPTION_VERSION = 1;

/** Current key version - increment when rotating encryption keys */
const CURRENT_KEY_VERSION = 1;

/**
 * Build Additional Authenticated Data (AAD) for AES-GCM encryption.
 * AAD binds ciphertext to its database record, preventing encrypted data from being moved
 * between records or tables.
 *
 * @param table - The database table name (e.g. "units", "items", "contacts")
 * @param recordId - The UUID of the record
 * @returns AAD string in the format "table:recordId"
 */
export function buildAAD(table: string, recordId: string): string {
  return `${table}:${recordId}`;
}

/**
 * Encrypt a string using AES-256-GCM
 *
 * @param data - The plaintext string to encrypt
 * @param key - The CryptoKey to use for encryption
 * @param aad - Optional Additional Authenticated Data to bind ciphertext to its context.
 *              When provided, the same AAD must be supplied during decryption.
 *              Use to prevent ciphertext from being moved between records/contexts.
 *              Format: `table:recordId` (use `buildAAD(table, recordId)` helper)
 * @returns Encrypted data with IV and ciphertext
 */
export async function encrypt(
  data: string,
  key: CryptoKey,
  aad?: string
): Promise<EncryptedData> {
  try {
    const iv = generateIV();
    const encoded = new TextEncoder().encode(data);

    const algorithm: AesGcmParams = { name: "AES-GCM", iv, tagLength: 128 };
    if (aad) {
      algorithm.additionalData = new TextEncoder().encode(aad);
    }

    const ciphertext = await crypto.subtle.encrypt(algorithm, key, encoded);

    return {
      iv: base64Encode(iv),
      ciphertext: base64Encode(new Uint8Array(ciphertext)),
      version: ENCRYPTION_VERSION,
      keyVersion: CURRENT_KEY_VERSION,
    };
  } catch (error) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      "Failed to encrypt data",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt encrypted data using AES-256-GCM
 *
 * @param encrypted - The encrypted data object
 * @param key - The CryptoKey to use for decryption
 * @param aad - Optional Additional Authenticated Data. Must match the AAD used during encryption.
 * @returns The decrypted plaintext string
 */
export async function decrypt(
  encrypted: EncryptedData,
  key: CryptoKey,
  aad?: string
): Promise<string> {
  try {
    const iv = base64Decode(encrypted.iv);
    const ciphertext = base64Decode(encrypted.ciphertext);

    const algorithm: AesGcmParams = { name: "AES-GCM", iv, tagLength: 128 };
    if (aad) {
      algorithm.additionalData = new TextEncoder().encode(aad);
    }

    const decrypted = await crypto.subtle.decrypt(algorithm, key, ciphertext);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      "Failed to decrypt data - possibly wrong key or corrupted data",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Encrypt a JavaScript object by JSON-serializing it first
 *
 * @param data - The object to encrypt
 * @param key - The CryptoKey to use for encryption
 * @param aad - Optional Additional Authenticated Data
 * @returns Encrypted data
 */
export async function encryptObject<T extends object>(
  data: T,
  key: CryptoKey,
  aad?: string
): Promise<EncryptedData> {
  const json = JSON.stringify(data);
  return encrypt(json, key, aad);
}

/**
 * Decrypt and parse encrypted data as a JavaScript object
 *
 * @param encrypted - The encrypted data
 * @param key - The CryptoKey to use for decryption
 * @param aad - Optional Additional Authenticated Data. Must match the AAD used during encryption.
 * @returns The decrypted and parsed object
 */
export async function decryptObject<T extends object>(
  encrypted: EncryptedData,
  key: CryptoKey,
  aad?: string
): Promise<T> {
  const json = await decrypt(encrypted, key, aad);
  try {
    return JSON.parse(json) as T;
  } catch {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      "Decrypted data is not valid JSON"
    );
  }
}

/**
 * Serialize encrypted data for database storage
 * Returns a JSON string that can be stored in a text column
 */
export function serializeEncryptedData(data: EncryptedData): string {
  return JSON.stringify(data);
}

/**
 * Parse encrypted data from database storage
 */
export function parseEncryptedData(serialized: string): EncryptedData {
  try {
    const parsed = JSON.parse(serialized);
    if (
      typeof parsed.iv !== "string" ||
      typeof parsed.ciphertext !== "string" ||
      typeof parsed.version !== "number"
    ) {
      throw new Error("Invalid encrypted data structure");
    }
    return parsed as EncryptedData;
  } catch (error) {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      "Failed to parse encrypted data from storage",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Check if a value looks like encrypted data
 */
export function isEncryptedData(value: unknown): value is EncryptedData {
  return (
    typeof value === "object" &&
    value !== null &&
    "iv" in value &&
    "ciphertext" in value &&
    "version" in value &&
    typeof (value as EncryptedData).iv === "string" &&
    typeof (value as EncryptedData).ciphertext === "string" &&
    typeof (value as EncryptedData).version === "number"
  );
}

/**
 * Batch encrypt multiple fields of an object
 * Encrypts string and object values; leaves other types unchanged
 *
 * @param aad - Optional Additional Authenticated Data applied to all fields
 */
export async function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  key: CryptoKey,
  aad?: string
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...data };

  await Promise.all(
    fieldsToEncrypt.map(async (field) => {
      const value = data[field];
      if (value !== null && value !== undefined) {
        if (typeof value === "string") {
          result[field as string] = await encrypt(value, key, aad);
        } else if (typeof value === "object") {
          result[field as string] = await encryptObject(
            value as Record<string, unknown>,
            key,
            aad
          );
        }
      }
    })
  );

  return result;
}

/**
 * Batch decrypt multiple fields of an object
 *
 * @param aad - Optional Additional Authenticated Data. Must match the AAD used during encryption.
 */
export async function decryptFields<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  fieldsToDecrypt: (keyof T)[],
  key: CryptoKey,
  aad?: string
): Promise<T> {
  const result: Record<string, unknown> = { ...data };

  await Promise.all(
    fieldsToDecrypt.map(async (field) => {
      const value = data[field as string];
      if (isEncryptedData(value)) {
        result[field as string] = await decrypt(value, key, aad);
      }
    })
  );

  return result as T;
}

// =============================================================================
// BINARY ENCRYPTION (for files/attachments)
// =============================================================================

/**
 * Encrypt binary data (ArrayBuffer) using AES-256-GCM.
 * Returns a single ArrayBuffer with the IV prepended: [IV (12 bytes)][Ciphertext+AuthTag]
 *
 * This is used for encrypting file attachments where the data is binary
 * rather than a UTF-8 string.
 *
 * @param data - The binary data to encrypt
 * @param key - The CryptoKey to use for encryption
 * @param aad - Optional Additional Authenticated Data to bind ciphertext to its context.
 * @returns A single ArrayBuffer containing IV + ciphertext
 */
export async function encryptBinary(
  data: ArrayBuffer,
  key: CryptoKey,
  aad?: string
): Promise<ArrayBuffer> {
  try {
    const iv = generateIV();

    const algorithm: AesGcmParams = { name: "AES-GCM", iv, tagLength: 128 };
    if (aad) {
      algorithm.additionalData = new TextEncoder().encode(aad);
    }

    const ciphertext = await crypto.subtle.encrypt(algorithm, key, data);

    // Prepend IV to ciphertext for self-contained encrypted blob
    const result = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), iv.byteLength);
    return result.buffer;
  } catch (error) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      "Failed to encrypt binary data",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypt binary data that was encrypted with encryptBinary().
 * Expects format: [IV (12 bytes)][Ciphertext+AuthTag]
 *
 * @param encrypted - The encrypted binary data (IV + ciphertext)
 * @param key - The CryptoKey to use for decryption
 * @param aad - Optional Additional Authenticated Data. Must match the AAD used during encryption.
 * @returns The decrypted binary data
 */
export async function decryptBinary(
  encrypted: ArrayBuffer,
  key: CryptoKey,
  aad?: string
): Promise<ArrayBuffer> {
  try {
    const IV_LENGTH = 12;
    if (encrypted.byteLength <= IV_LENGTH) {
      throw new Error("Encrypted data too short to contain IV and ciphertext");
    }

    const iv = encrypted.slice(0, IV_LENGTH);
    const ciphertext = encrypted.slice(IV_LENGTH);

    const algorithm: AesGcmParams = { name: "AES-GCM", iv, tagLength: 128 };
    if (aad) {
      algorithm.additionalData = new TextEncoder().encode(aad);
    }

    return await crypto.subtle.decrypt(algorithm, key, ciphertext);
  } catch (error) {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      "Failed to decrypt binary data - possibly wrong key or corrupted data",
      error instanceof Error ? error : undefined
    );
  }
}
