import { z } from "zod";

/**
 * Schema for encrypted data fields.
 * Validates that the encrypted data is valid JSON with required fields (iv, ciphertext, version).
 *
 * Shared across task server actions.
 */
export const EncryptedDataSchema = z
  .string()
  .min(1)
  .max(100000) // 100KB max for encrypted data
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
