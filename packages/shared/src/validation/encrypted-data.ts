import { z } from "zod";

/** Default max serialized length for encrypted fields (100KB). */
const DEFAULT_MAX_ENCRYPTED_DATA_CHARS = 100000;

/**
 * Build a schema for encrypted data fields with a custom max serialized length.
 * Validates that the encrypted data is valid JSON with required fields (iv, ciphertext, version).
 *
 * Use this for fields whose ciphertext can legitimately exceed the default
 * 100KB cap (e.g. encrypted binary documents).
 */
export function createEncryptedDataSchema(
  maxLength: number
): z.ZodType<string> {
  return z
    .string()
    .min(1)
    .max(maxLength)
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val);
          const base64Regex = /^[A-Za-z0-9+/]+=*$/;
          return (
            typeof parsed.iv === "string" &&
            parsed.iv.length >= 16 &&
            parsed.iv.length <= 128 &&
            base64Regex.test(parsed.iv) &&
            typeof parsed.ciphertext === "string" &&
            parsed.ciphertext.length >= 24 &&
            base64Regex.test(parsed.ciphertext) &&
            typeof parsed.version === "number" &&
            Number.isInteger(parsed.version) &&
            parsed.version >= 1
          );
        } catch {
          return false;
        }
      },
      { message: "Invalid encrypted data format" }
    );
}

/**
 * Schema for encrypted data fields (100KB max).
 *
 * Shared across task, contact, note, and link server actions.
 */
export const EncryptedDataSchema = createEncryptedDataSchema(
  DEFAULT_MAX_ENCRYPTED_DATA_CHARS
);
