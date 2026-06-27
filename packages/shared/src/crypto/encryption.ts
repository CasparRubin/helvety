/**
 * Encryption Module
 * AES-256-GCM encryption and decryption for user content
 */

import { base64Encode, base64Decode, generateIV } from "./encoding";
import { CryptoError, CryptoErrorType } from "./types";

import type { EncryptedData } from "./types";

/** Legacy encryption format: AAD binds table + record id only. */
export const ENCRYPTION_VERSION_LEGACY = 1;

/** Current encryption format: AAD binds table + record id + column. */
export const ENCRYPTION_VERSION = 2;

/** Supported `EncryptedData.version` values for read paths. */
export const SUPPORTED_ENCRYPTION_VERSIONS = [
  ENCRYPTION_VERSION_LEGACY,
  ENCRYPTION_VERSION,
] as const;

/** Supported encryption format version literal union. */
export type SupportedEncryptionVersion =
  (typeof SUPPORTED_ENCRYPTION_VERSIONS)[number];

/** Current key version - increment when rotating encryption keys */
export const CURRENT_KEY_VERSION = 1;

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

/** Column names allowed in v2 field-bound AAD (encrypted_* DB columns). */
const COLUMN_NAME_REGEX = /^encrypted_[a-z0-9_]+$/;

/** Context for entity field encryption/decryption with version-aware AAD. */
export type EntityFieldAadContext = {
  table: string;
  recordId: string;
  column: string;
};

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

/** Validates encrypted column name format for v2 field-bound AAD. */
function assertAllowedColumn(column: string): void {
  if (!COLUMN_NAME_REGEX.test(column)) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      `Invalid AAD column name: ${column}`
    );
  }
}

/** Returns true when `version` is a supported encryption format version. */
export function isSupportedEncryptionVersion(
  version: number
): version is SupportedEncryptionVersion {
  return (SUPPORTED_ENCRYPTION_VERSIONS as readonly number[]).includes(version);
}

/** Validates encryption version before decrypt; throws on unsupported values. */
export function assertSupportedEncryptionVersion(version: number): void {
  if (!isSupportedEncryptionVersion(version)) {
    throw new CryptoError(
      CryptoErrorType.DECRYPTION_FAILED,
      `Unsupported encryption version: ${version}`
    );
  }
}

/**
 * Build Additional Authenticated Data (AAD) for AES-GCM encryption (v1 legacy).
 * AAD binds ciphertext to its database record, preventing encrypted data from being moved
 * between records or tables.
 *
 * @param table - The database table name (e.g. "items", "contacts")
 * @param recordId - The UUID of the record
 * @returns AAD string in the format "table:recordId"
 */
export function buildAAD(table: string, recordId: string): string {
  assertAllowedTable(table);
  assertUuidRecordId(recordId);
  return `${table}:${recordId}`;
}

/**
 * Build field-bound AAD for v2 encryption (`table:recordId:column`).
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

/**
 * Resolve the AAD string used during encryption for a stored ciphertext version.
 */
export function resolveAADForDecrypt(
  context: EntityFieldAadContext,
  version: number
): string {
  assertSupportedEncryptionVersion(version);
  if (version >= ENCRYPTION_VERSION) {
    return buildFieldAAD(context.table, context.recordId, context.column);
  }
  return buildAAD(context.table, context.recordId);
}

/**
 * Encrypt a string using AES-256-GCM
 *
 * @param data - The plaintext string to encrypt
 * @param key - The CryptoKey to use for encryption
 * @param aad - Optional Additional Authenticated Data to bind ciphertext to its context.
 *              When provided, the same AAD must be supplied during decryption.
 *              Use to prevent ciphertext from being moved between records/contexts.
 *              Format: legacy v1 `table:recordId` (`buildAAD`); v2 field-bound
 *              `table:recordId:column` (`buildFieldAAD` / `encryptEntityField`)
 * @param encryptionVersion - Format version stored in the payload (default: legacy v1).
 * @returns Encrypted data with IV and ciphertext
 */
export async function encrypt(
  data: string,
  key: CryptoKey,
  aad?: string,
  encryptionVersion: number = ENCRYPTION_VERSION_LEGACY
): Promise<EncryptedData> {
  if (!isSupportedEncryptionVersion(encryptionVersion)) {
    throw new CryptoError(
      CryptoErrorType.ENCRYPTION_FAILED,
      `Unsupported encryption version: ${encryptionVersion}`
    );
  }

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
      version: encryptionVersion,
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

/**
 * Encrypt an entity field with v2 field-bound AAD (preferred for new writes).
 */
export async function encryptEntityField(
  data: string,
  key: CryptoKey,
  context: EntityFieldAadContext
): Promise<EncryptedData> {
  const aad = buildFieldAAD(context.table, context.recordId, context.column);
  return encrypt(data, key, aad, ENCRYPTION_VERSION);
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
  assertSupportedEncryptionVersion(encrypted.version);

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

    const algorithm: AesGcmParams = { name: "AES-GCM", iv, tagLength: 128 };
    if (aad) {
      algorithm.additionalData = new TextEncoder().encode(aad);
    }

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

/**
 * Decrypt an entity field using version-aware AAD resolution (v1 + v2).
 */
export async function decryptEntityField(
  encrypted: EncryptedData,
  key: CryptoKey,
  context: EntityFieldAadContext
): Promise<string> {
  const aad = resolveAADForDecrypt(context, encrypted.version);
  return decrypt(encrypted, key, aad);
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
  aad?: string,
  encryptionVersion: number = ENCRYPTION_VERSION_LEGACY
): Promise<EncryptedData> {
  const json = JSON.stringify(data);
  return encrypt(json, key, aad, encryptionVersion);
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
    assertSupportedEncryptionVersion(parsed.version);
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

/**
 * Check if a value looks like encrypted data with a supported version.
 */
export function isEncryptedData(value: unknown): value is EncryptedData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("iv" in value) ||
    !("ciphertext" in value) ||
    !("version" in value)
  ) {
    return false;
  }

  const candidate = value as EncryptedData;
  if (
    typeof candidate.iv !== "string" ||
    typeof candidate.ciphertext !== "string" ||
    typeof candidate.version !== "number"
  ) {
    return false;
  }

  if (!isSupportedEncryptionVersion(candidate.version)) {
    return false;
  }

  if (
    candidate.keyVersion !== undefined &&
    typeof candidate.keyVersion !== "number"
  ) {
    return false;
  }

  return true;
}

/**
 * Batch encrypt multiple fields of an object
 * Only encrypts string values, leaves other types unchanged
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
