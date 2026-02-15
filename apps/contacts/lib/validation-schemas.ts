import { z } from "zod";

/**
 * Schema for encrypted data fields.
 * Validates that the encrypted data is valid JSON with required fields (iv, ciphertext, version).
 *
 * Shared across contact-actions and category-actions.
 */
export const EncryptedDataSchema = z
  .string()
  .min(1)
  .max(100000) // 100KB max for encrypted data
  .refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return (
          typeof parsed.iv === "string" &&
          typeof parsed.ciphertext === "string" &&
          typeof parsed.version === "number"
        );
      } catch {
        return false;
      }
    },
    { message: "Invalid encrypted data format" }
  );
