import { describe, expect, it } from "vitest";

import {
  assertNoPlaintextContentKeys,
  assertEncryptedWritePayload,
  assertEncryptedWritePayloadAuto,
  PLAINTEXT_CONTENT_FIELD_NAMES,
} from "./e2ee-write-guard";
import { assertEntityLinkMetadataEmpty } from "./entity-links-client";

describe("e2ee-write-guard", () => {
  it("rejects plaintext content keys on write payloads", () => {
    expect(() => assertNoPlaintextContentKeys({ title: "secret" })).toThrow(
      /forbidden plaintext field "title"/
    );
  });

  it("validates encrypted fields are v2 ciphertext strings", () => {
    const payload = {
      encrypted_title: JSON.stringify({
        iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
        ciphertext: "QUFBQUFBQUFBQUFBQUFBQQ==",
        version: 2,
      }),
    };
    expect(() => assertEncryptedWritePayloadAuto(payload)).not.toThrow();
  });

  it("rejects legacy v1 encrypted payloads", () => {
    const payload = {
      encrypted_title: JSON.stringify({
        iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
        ciphertext: "QUFBQUFBQUFBQUFBQUFBQQ==",
        version: 1,
      }),
    };
    expect(() => assertEncryptedWritePayloadAuto(payload)).toThrow(
      /invalid encrypted field|Unsupported encryption version|version 2/
    );
  });
});

describe("assertEncryptedWritePayload", () => {
  const validV2 = JSON.stringify({
    iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
    ciphertext: "QUFBQUFBQUFBQUFBQUFBQUFBQQ==",
    version: 2,
  });

  it("allows null encrypted fields and skips undefined keys", () => {
    const payload = {
      encrypted_title: validV2,
      encrypted_description: null,
    };
    expect(() =>
      assertEncryptedWritePayload(payload, [
        "encrypted_title",
        "encrypted_description",
        "encrypted_notes",
      ])
    ).not.toThrow();
  });

  it("validates only the named encrypted fields", () => {
    const payload = {
      encrypted_title: validV2,
      encrypted_description: JSON.stringify({
        iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
        ciphertext: "QUFBQUFBQUFBQUFBQUFBQQ==",
        version: 1,
      }),
    };
    expect(() =>
      assertEncryptedWritePayload(payload, ["encrypted_title"])
    ).not.toThrow();
    expect(() =>
      assertEncryptedWritePayload(payload, ["encrypted_description"])
    ).toThrow(
      /invalid encrypted field|version 2|Invalid encrypted data format/
    );
  });

  it("rejects non-string non-null encrypted values", () => {
    const payload = { encrypted_title: 42 };
    expect(() =>
      assertEncryptedWritePayload(payload, ["encrypted_title"])
    ).toThrow(/must be a string or null/);
  });
});

describe("PLAINTEXT_CONTENT_FIELD_NAMES", () => {
  it("covers every zone plaintext content column name", () => {
    expect(PLAINTEXT_CONTENT_FIELD_NAMES).toEqual(
      expect.arrayContaining([
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
      ])
    );
    expect(PLAINTEXT_CONTENT_FIELD_NAMES).toHaveLength(10);
  });
});

describe("assertEntityLinkMetadataEmpty", () => {
  it("allows undefined and empty metadata", () => {
    expect(() => assertEntityLinkMetadataEmpty(undefined)).not.toThrow();
    expect(() => assertEntityLinkMetadataEmpty({})).not.toThrow();
  });

  it("rejects non-empty metadata", () => {
    expect(() => assertEntityLinkMetadataEmpty({ note: "x" })).toThrow(
      /must remain empty/
    );
  });
});
