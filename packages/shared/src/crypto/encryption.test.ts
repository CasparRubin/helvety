/**
 * Unit tests for field-bound entity encryption and wire-format validation.
 */

import { describe, expect, it } from "vitest";

import {
  ENCRYPTION_VERSION,
  buildFieldAAD,
  decryptEntityField,
  encryptEntityField,
  parseEncryptedData,
  serializeEncryptedData,
} from "./encryption";

const RECORD_ID = "550e8400-e29b-41d4-a716-446655440000";

/** Generates a non-extractable AES-256-GCM key for unit tests. */
async function testKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

describe("ENCRYPTION_VERSION", () => {
  it("is the only accepted wire format version", () => {
    expect(ENCRYPTION_VERSION).toBe(2);
  });
});

describe("buildFieldAAD", () => {
  it("binds table, record id, and column", () => {
    expect(buildFieldAAD("contacts", RECORD_ID, "encrypted_email")).toBe(
      `contacts:${RECORD_ID}:encrypted_email`
    );
  });

  it("rejects invalid column names", () => {
    expect(() => buildFieldAAD("contacts", RECORD_ID, "email")).toThrow(
      "Invalid AAD column name"
    );
  });
});

describe("encryptEntityField / decryptEntityField", () => {
  it("round-trips with field-bound AAD", async () => {
    const key = await testKey();
    const encrypted = await encryptEntityField("secret@example.com", key, {
      table: "contacts",
      recordId: RECORD_ID,
      column: "encrypted_email",
    });
    expect(encrypted.version).toBe(ENCRYPTION_VERSION);
    const plain = await decryptEntityField(encrypted, key, {
      table: "contacts",
      recordId: RECORD_ID,
      column: "encrypted_email",
    });
    expect(plain).toBe("secret@example.com");
  });

  it("rejects intra-record column swap", async () => {
    const key = await testKey();
    const encrypted = await encryptEntityField("555-0100", key, {
      table: "contacts",
      recordId: RECORD_ID,
      column: "encrypted_phone",
    });
    await expect(
      decryptEntityField(encrypted, key, {
        table: "contacts",
        recordId: RECORD_ID,
        column: "encrypted_email",
      })
    ).rejects.toThrow();
  });
});

describe("parseEncryptedData", () => {
  it("rejects unsupported versions", async () => {
    const key = await testKey();
    const payload = await encryptEntityField("x", key, {
      table: "notes",
      recordId: RECORD_ID,
      column: "encrypted_title",
    });
    const serialized = serializeEncryptedData({
      ...payload,
      version: 99,
    });
    expect(() => parseEncryptedData(serialized)).toThrow(
      "Unsupported encryption version"
    );
  });

  it("accepts current-format payloads", async () => {
    const key = await testKey();
    const encrypted = await encryptEntityField("title", key, {
      table: "notes",
      recordId: RECORD_ID,
      column: "encrypted_title",
    });
    const parsed = parseEncryptedData(serializeEncryptedData(encrypted));
    expect(parsed.version).toBe(ENCRYPTION_VERSION);
  });
});
