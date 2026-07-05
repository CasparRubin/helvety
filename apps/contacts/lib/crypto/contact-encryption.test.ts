import { buildFieldAAD } from "@helvety/shared/crypto/encryption";
import { describe, expect, it } from "vitest";

import * as contactEncryption from "./contact-encryption";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("contacts crypto buildFieldAAD", () => {
  it("accepts the contacts table name", () => {
    expect(buildFieldAAD("contacts", VALID_UUID, "encrypted_email")).toBe(
      `contacts:${VALID_UUID}:encrypted_email`
    );
  });

  it("rejects invalid UUID record ids", () => {
    expect(() =>
      buildFieldAAD("contacts", "not-a-uuid", "encrypted_email")
    ).toThrow("Invalid AAD record ID");
  });
});

describe("contacts contact-encryption module surface", () => {
  it("does not expose legacy category helpers", () => {
    expect("encryptCategoryConfigInput" in contactEncryption).toBe(false);
    expect("decryptCategoryConfigRow" in contactEncryption).toBe(false);
    expect("encryptCategoryInput" in contactEncryption).toBe(false);
    expect("decryptCategoryRow" in contactEncryption).toBe(false);
  });
});
