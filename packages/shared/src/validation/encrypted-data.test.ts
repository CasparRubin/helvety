import { describe, expect, it } from "vitest";

import { sampleEncryptedField } from "../test-utils/action-test-helpers";

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
  it("accepts the shared action-test fixture", () => {
    expect(EncryptedDataSchema.safeParse(sampleEncryptedField()).success).toBe(
      true
    );
  });

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

  it("rejects IV shorter than 16 characters", () => {
    expect(
      EncryptedDataSchema.safeParse(
        JSON.stringify({
          iv: "c2hvcnQ=",
          ciphertext: "QUFBQUFBQUFBQUFBQUFBQUFBQQ==",
          version: 1,
        })
      ).success
    ).toBe(false);
  });

  it("rejects ciphertext shorter than 24 characters", () => {
    expect(
      EncryptedDataSchema.safeParse(
        JSON.stringify({
          iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
          ciphertext: "c2hvcnQ=",
          version: 1,
        })
      ).success
    ).toBe(false);
  });

  it("rejects version below 1", () => {
    expect(
      EncryptedDataSchema.safeParse(
        JSON.stringify({
          iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
          ciphertext: "QUFBQUFBQUFBQUFBQUFBQUFBQQ==",
          version: 0,
        })
      ).success
    ).toBe(false);
  });

  it("rejects non-base64 IV characters", () => {
    expect(
      EncryptedDataSchema.safeParse(
        JSON.stringify({
          iv: "!!!!not-base64!!!!!!",
          ciphertext: "QUFBQUFBQUFBQUFBQUFBQUFBQQ==",
          version: 1,
        })
      ).success
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
