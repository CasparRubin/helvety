/**
 * Unit tests for encryption version handling and v2 field-bound AAD.
 */

import { describe, expect, it } from "vitest";

import {
  ENCRYPTION_VERSION,
  buildFieldAAD,
  decryptEntityField,
  encrypt,
  encryptEntityField,
  encryptFields,
  decryptFields,
  isEncryptedData,
  isSupportedEncryptionVersion,
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

describe("encryption version constants", () => {
  it("supports v2 only", () => {
    expect(isSupportedEncryptionVersion(ENCRYPTION_VERSION)).toBe(true);
    expect(isSupportedEncryptionVersion(1)).toBe(false);
    expect(isSupportedEncryptionVersion(99)).toBe(false);
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
  it("round-trips with v2 field-bound AAD", async () => {
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

  it("rejects intra-record column swap on v2 ciphertext", async () => {
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

  it("defaults encrypt() to v2", async () => {
    const key = await testKey();
    const aad = buildFieldAAD("contacts", RECORD_ID, "encrypted_email");
    const payload = await encrypt("value", key, aad);
    expect(payload.version).toBe(ENCRYPTION_VERSION);
  });
});

describe("parseEncryptedData / isEncryptedData", () => {
  it("rejects unsupported versions", async () => {
    const key = await testKey();
    const aad = buildFieldAAD("notes", RECORD_ID, "encrypted_title");
    const payload = await encrypt("x", key, aad);
    const serialized = serializeEncryptedData({
      ...payload,
      version: 99,
    });
    expect(() => parseEncryptedData(serialized)).toThrow(
      "Unsupported encryption version"
    );
    expect(
      isEncryptedData({
        iv: payload.iv,
        ciphertext: payload.ciphertext,
        version: 99,
      })
    ).toBe(false);
  });

  it("rejects legacy v1 payloads", async () => {
    const key = await testKey();
    const payload = await encryptEntityField("title", key, {
      table: "notes",
      recordId: RECORD_ID,
      column: "encrypted_title",
    });
    const serialized = serializeEncryptedData({ ...payload, version: 1 });
    expect(() => parseEncryptedData(serialized)).toThrow(
      "Unsupported encryption version"
    );
  });

  it("accepts v2 payloads", async () => {
    const key = await testKey();
    const v2 = await encryptEntityField("title", key, {
      table: "notes",
      recordId: RECORD_ID,
      column: "encrypted_title",
    });
    const parsed = parseEncryptedData(serializeEncryptedData(v2));
    expect(isEncryptedData(parsed)).toBe(true);
    expect(parsed.version).toBe(ENCRYPTION_VERSION);
  });
});

describe("encryptFields / decryptFields (shared-AAD batch helpers)", () => {
  it("round-trips string fields with the same optional AAD", async () => {
    const key = await testKey();
    const aad = "batch:context";
    const encrypted = await encryptFields(
      { title: "Hello", stage_id: "default-item-backlog" },
      ["title"],
      key,
      aad
    );
    expect(encrypted.stage_id).toBe("default-item-backlog");
    expect(encrypted.title).toMatchObject({
      iv: expect.any(String),
      ciphertext: expect.any(String),
      version: ENCRYPTION_VERSION,
    });

    const decrypted = await decryptFields<{ title: string }>(
      encrypted,
      ["title"],
      key,
      aad
    );
    expect(decrypted.title).toBe("Hello");
  });
});
