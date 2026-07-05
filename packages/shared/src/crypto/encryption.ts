/**
 * Encryption Module
 * AES-256-GCM encryption and decryption for user content
 */

import { base64Encode, base64Decode, generateIV } from "./encoding";
import { CryptoError, CryptoErrorType } from "./types";

import type { EncryptedData } from "./types";

/** Wire format version: AAD binds table + record id + column. */
export const ENCRYPTION_VERSION = 2;

/** Current key version - increment when rotating encryption keys */
const CURRENT_KEY_VERSION = 1;

const ALLOWED_AAD_TABLES = new Set([
  "items",
  "contacts",
  "notes",
  "link_folders",
  "links",
  "item_contact_links",
]);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Column names allowed in field-bound AAD (encrypted_* DB columns). */
const COLUMN_NAME_REGEX = /^encrypted_[a-z0-9_]+$/;

/** Context for entity field encryption/decryption. */
type EntityFieldAadContext = {
  table: string;
  recordId: string;
  column: string;
};

/** Returns true when `version` matches the current encryption wire format. */
function isCurrentEncryptionVersion(
  version: number
): version is typeof ENCRYPTION_VERSION {
  return version === ENCRYPTION_VERSION;
}

/** Validates encryption version before decrypt; throws on unsupported values. */
function assertCurrentEncryptionVersion(version: number): void {
  if (!isCurrentEncryptionVersion(version)) {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      `Unsupported encryption version: ${version}`
    );
  }
}

/** Validates table name against the allowlist used for AAD binding. */
function assertAllowedTable(table: string): void {
  if (!ALLOWED_AAD_TABLES.has(table)) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      `Invalid AAD table name: ${table}`
    );
  }
}

/** Validates record id is a UUID before AAD construction. */
function assertUuidRecordId(recordId: string): void {
  if (!UUID_REGEX.test(recordId)) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      "Invalid AAD record ID: expected UUID format"
    );
  }
}

/** Validates encrypted column name format for field-bound AAD. */
function assertAllowedColumn(column: string): void {
  if (!COLUMN_NAME_REGEX.test(column)) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      `Invalid AAD column name: ${column}`
    );
  }
}

/**
 * Build field-bound AAD (`table:recordId:column`).
 * Prevents intra-record ciphertext column swaps.
 */
export function buildFieldAAD(
  table: string,
  recordId: string,
  column: string
): string {
  assertAllowedTable(table);
  assertUuidRecordId(recordId);
  assertAllowedColumn(column);
  return `${table}:${recordId}:${column}`;
}

/** Encrypt a string with AES-256-GCM and field-bound AAD. */
async function encryptWithAad(
  data: string,
  key: CryptoKey,
  aad: string
): Promise<EncryptedData> {
  try {
    const iv = generateIV();
    const encoded = new TextEncoder().encode(data);

    const algorithm: AesGcmParams = {
      name: "AES-GCM",
      iv,
      tagLength: 128,
      additionalData: new TextEncoder().encode(aad),
    };

    const ciphertext = await crypto.subtle.encrypt(algorithm, key, encoded);

    return {
      iv: base64Encode(iv),
      ciphertext: base64Encode(new Uint8Array(ciphertext)),
      version: ENCRYPTION_VERSION,
      keyVersion: CURRENT_KEY_VERSION,
    };
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      "Failed to encrypt data",
      error instanceof Error ? error : undefined
    );
  }
}

/** Decrypt AES-256-GCM ciphertext with field-bound AAD. */
async function decryptWithAad(
  encrypted: EncryptedData,
  key: CryptoKey,
  aad: string
): Promise<string> {
  assertCurrentEncryptionVersion(encrypted.version);

  if (
    encrypted.keyVersion !== undefined &&
    encrypted.keyVersion !== CURRENT_KEY_VERSION
  ) {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      `Unsupported key version: ${encrypted.keyVersion}`
    );
  }

  try {
    const iv = base64Decode(encrypted.iv);
    const ciphertext = base64Decode(encrypted.ciphertext);

    const algorithm: AesGcmParams = {
      name: "AES-GCM",
      iv,
      tagLength: 128,
      additionalData: new TextEncoder().encode(aad),
    };

    const decrypted = await crypto.subtle.decrypt(algorithm, key, ciphertext);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      "Failed to decrypt data. The decryption key does not match this data, or the data is corrupted.",
      error instanceof Error ? error : undefined
    );
  }
}

/** Encrypt an entity field with field-bound AAD. */
export async function encryptEntityField(
  data: string,
  key: CryptoKey,
  context: EntityFieldAadContext
): Promise<EncryptedData> {
  const aad = buildFieldAAD(context.table, context.recordId, context.column);
  return encryptWithAad(data, key, aad);
}

/** Decrypt an entity field using field-bound AAD. */
export async function decryptEntityField(
  encrypted: EncryptedData,
  key: CryptoKey,
  context: EntityFieldAadContext
): Promise<string> {
  const aad = buildFieldAAD(context.table, context.recordId, context.column);
  return decryptWithAad(encrypted, key, aad);
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
    assertCurrentEncryptionVersion(parsed.version);
    if (
      parsed.keyVersion !== undefined &&
      typeof parsed.keyVersion !== "number"
    ) {
      throw new Error("Invalid encrypted data keyVersion");
    }
    return parsed as EncryptedData;
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      "Failed to parse encrypted data from storage",
      error instanceof Error ? error : undefined
    );
  }
}
