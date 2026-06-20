/**
 * Unit tests for encryption version handling and v2 field-bound AAD.
 */

import { describe, expect, it } from "vitest";

import {
  ENCRYPTION_VERSION,
  ENCRYPTION_VERSION_LEGACY,
  buildAAD,
  buildFieldAAD,
  decryptEntityField,
  encrypt,
  encryptEntityField,
  isEncryptedData,
  isSupportedEncryptionVersion,
  parseEncryptedData,
  resolveAADForDecrypt,
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
  it("supports legacy and current versions", () => {
    expect(isSupportedEncryptionVersion(ENCRYPTION_VERSION_LEGACY)).toBe(true);
    expect(isSupportedEncryptionVersion(ENCRYPTION_VERSION)).toBe(true);
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

describe("resolveAADForDecrypt", () => {
  it("uses record-level AAD for v1", () => {
    expect(
      resolveAADForDecrypt(
        {
          table: "contacts",
          recordId: RECORD_ID,
          column: "encrypted_email",
        },
        ENCRYPTION_VERSION_LEGACY
      )
    ).toBe(buildAAD("contacts", RECORD_ID));
  });

  it("uses field-bound AAD for v2", () => {
    expect(
      resolveAADForDecrypt(
        {
          table: "contacts",
          recordId: RECORD_ID,
          column: "encrypted_email",
        },
        ENCRYPTION_VERSION
      )
    ).toBe(buildFieldAAD("contacts", RECORD_ID, "encrypted_email"));
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

  it("decrypts legacy v1 ciphertext with record-level AAD", async () => {
    const key = await testKey();
    const aad = buildAAD("contacts", RECORD_ID);
    const legacy = await encrypt(
      "legacy value",
      key,
      aad,
      ENCRYPTION_VERSION_LEGACY
    );
    const plain = await decryptEntityField(legacy, key, {
      table: "contacts",
      recordId: RECORD_ID,
      column: "encrypted_email",
    });
    expect(plain).toBe("legacy value");
  });
});

describe("parseEncryptedData / isEncryptedData", () => {
  it("rejects unsupported versions", async () => {
    const key = await testKey();
    const payload = await encrypt("x", key, buildAAD("notes", RECORD_ID));
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

  it("accepts v1 and v2 payloads", async () => {
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
