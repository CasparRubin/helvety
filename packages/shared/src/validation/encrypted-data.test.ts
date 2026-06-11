import { describe, expect, it } from "vitest";

import {
  createEncryptedDataSchema,
  EncryptedDataSchema,
} from "./encrypted-data";

/** Minimal valid encrypted JSON payload. */
function validEncryptedJson(ciphertextLength = 24): string {
  return JSON.stringify({
    iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
    ciphertext: "A".repeat(ciphertextLength),
    version: 1,
  });
}

describe("EncryptedDataSchema", () => {
  it("accepts payloads up to the default 100KB cap", () => {
    const payload = validEncryptedJson(50_000);
    expect(EncryptedDataSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects payloads above the default 100KB cap", () => {
    const payload = validEncryptedJson(100_001);
    expect(EncryptedDataSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects invalid encrypted JSON shape", () => {
    expect(
      EncryptedDataSchema.safeParse(JSON.stringify({ iv: "short", version: 1 }))
        .success
    ).toBe(false);
  });
});

describe("createEncryptedDataSchema", () => {
  it("honours a custom max length for large ciphertext fields", () => {
    const largeSchema = createEncryptedDataSchema(500_000);
    const payload = validEncryptedJson(400_000);
    expect(largeSchema.safeParse(payload).success).toBe(true);
    expect(largeSchema.safeParse(validEncryptedJson(500_001)).success).toBe(
      false
    );
  });
});
