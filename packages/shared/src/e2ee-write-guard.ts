/**
 * Client-side E2EE write invariants shared by web apps and the Chromium extension.
 */

import { EncryptedDataSchema } from "./validation/encrypted-data";

/** Plaintext content field names that must never appear in DB write payloads. */
export const PLAINTEXT_CONTENT_FIELD_NAMES = [
  "title",
  "description",
  "first_name",
  "last_name",
  "name",
  "url",
  "email",
  "phone",
  "birthday",
  "notes",
] as const;

const PLAINTEXT_KEY_SET = new Set<string>(PLAINTEXT_CONTENT_FIELD_NAMES);

/** Throws when a write payload includes forbidden plaintext content keys. */
export function assertNoPlaintextContentKeys(
  payload: Record<string, unknown>
): void {
  for (const key of Object.keys(payload)) {
    if (PLAINTEXT_KEY_SET.has(key)) {
      throw new Error(`E2EE write guard: forbidden plaintext field "${key}"`);
    }
  }
}

/** Validates encrypted field strings in a write payload. */
export function assertEncryptedWritePayload(
  payload: Record<string, unknown>,
  encryptedFieldNames: readonly string[]
): void {
  assertNoPlaintextContentKeys(payload);

  for (const field of encryptedFieldNames) {
    const value = payload[field];
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      continue;
    }
    if (typeof value !== "string") {
      throw new Error(
        `E2EE write guard: encrypted field "${field}" must be a string or null`
      );
    }
    const result = EncryptedDataSchema.safeParse(value);
    if (!result.success) {
      throw new Error(
        `E2EE write guard: invalid encrypted field "${field}": ${result.error.message}`
      );
    }
  }
}

/** Validates all `encrypted_*` keys present on a write payload. */
export function assertEncryptedWritePayloadAuto(
  payload: Record<string, unknown>
): void {
  const encryptedFieldNames = Object.keys(payload).filter((key) =>
    key.startsWith("encrypted_")
  );
  assertEncryptedWritePayload(payload, encryptedFieldNames);
}
