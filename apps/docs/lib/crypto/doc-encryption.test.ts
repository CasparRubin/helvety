import { describe, expect, it } from "vitest";

import * as docEncryption from "./doc-encryption";
import { buildAAD } from "./encryption";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("docs crypto buildAAD", () => {
  it("accepts the docs table name", () => {
    expect(buildAAD("docs", VALID_UUID)).toBe(`docs:${VALID_UUID}`);
  });

  it("rejects invalid UUID record ids", () => {
    expect(() => buildAAD("docs", "not-a-uuid")).toThrow(
      "Invalid AAD record ID"
    );
  });
});

describe("docs doc-encryption module surface", () => {
  it("exposes vault encrypt/decrypt entrypoints", () => {
    expect(typeof docEncryption.encryptDocInput).toBe("function");
    expect(typeof docEncryption.encryptDocUpdate).toBe("function");
    expect(typeof docEncryption.decryptDocRow).toBe("function");
    expect(typeof docEncryption.decryptDocListItems).toBe("function");
  });
});

describe("docs doc-encryption round-trip", () => {
  it("rejects decryption when AAD record id does not match", async () => {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const encrypted = await docEncryption.encryptDocInput(
      { title: "Bound", docxBytes: new ArrayBuffer(0) },
      key
    );
    const row = {
      id: VALID_UUID,
      user_id: "user-1",
      encrypted_title: encrypted.encrypted_title,
      encrypted_docx: encrypted.encrypted_docx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await expect(docEncryption.decryptDocRow(row, key)).rejects.toThrow();
  });

  it("encrypts partial updates and decrypts list titles only", async () => {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const encrypted = await docEncryption.encryptDocInput(
      { title: "Draft", docxBytes: new TextEncoder().encode("PK").buffer },
      key
    );
    const titleOnly = await docEncryption.encryptDocUpdate(
      encrypted.id,
      { title: "Final" },
      key
    );
    expect(titleOnly.encrypted_docx).toBeUndefined();
    expect(titleOnly.encrypted_title).toBeDefined();

    const list = await docEncryption.decryptDocListItems(
      [
        {
          id: encrypted.id,
          user_id: "user-1",
          encrypted_title: titleOnly.encrypted_title!,
          encrypted_docx: encrypted.encrypted_docx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      key
    );
    expect(list[0]?.title).toBe("Final");
  });

  it("encrypts and decrypts title and docx bytes with AAD binding", async () => {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const sampleBytes = new TextEncoder().encode("PK sample docx").buffer;
    const encrypted = await docEncryption.encryptDocInput(
      { title: "My Doc", docxBytes: sampleBytes },
      key
    );
    const row = {
      id: encrypted.id,
      user_id: "user-1",
      encrypted_title: encrypted.encrypted_title,
      encrypted_docx: encrypted.encrypted_docx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const decrypted = await docEncryption.decryptDocRow(row, key);
    expect(decrypted.title).toBe("My Doc");
    expect(new Uint8Array(decrypted.docxBytes)).toEqual(
      new Uint8Array(sampleBytes)
    );
  });
});
