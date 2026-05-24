import { buildAAD } from "@helvety/shared/crypto/encryption";
import { describe, expect, it } from "vitest";

import * as contactEncryption from "./contact-encryption";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("contacts crypto buildAAD", () => {
  it("accepts the contacts table name", () => {
    expect(buildAAD("contacts", VALID_UUID)).toBe(`contacts:${VALID_UUID}`);
  });

  it("rejects invalid UUID record ids", () => {
    expect(() => buildAAD("contacts", "not-a-uuid")).toThrow(
      "Invalid AAD record ID"
    );
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
