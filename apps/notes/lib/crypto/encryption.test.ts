import { describe, expect, it } from "vitest";

import { buildAAD } from "./encryption";
import * as noteEncryption from "./note-encryption";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("notes crypto buildAAD", () => {
  it("accepts active table names", () => {
    expect(buildAAD("notes", VALID_UUID)).toBe(`notes:${VALID_UUID}`);
    expect(buildAAD("contacts", VALID_UUID)).toBe(`contacts:${VALID_UUID}`);
  });

  it("rejects removed legacy table names", () => {
    expect(() => buildAAD("stages", VALID_UUID)).toThrow(
      "Invalid AAD table name"
    );
    expect(() => buildAAD("label_configs", VALID_UUID)).toThrow(
      "Invalid AAD table name"
    );
  });

  it("rejects invalid UUID record ids", () => {
    expect(() => buildAAD("notes", "not-a-uuid")).toThrow(
      "Invalid AAD record ID"
    );
  });
});

describe("notes note-encryption module surface", () => {
  it("does not expose legacy stage/label helpers", () => {
    expect("encryptStageInput" in noteEncryption).toBe(false);
    expect("decryptStageRow" in noteEncryption).toBe(false);
    expect("encryptLabelInput" in noteEncryption).toBe(false);
    expect("decryptLabelRow" in noteEncryption).toBe(false);
  });

  it("exposes item encrypt/decrypt entrypoints (title/description only; category stays plaintext)", () => {
    expect(typeof noteEncryption.encryptItemInput).toBe("function");
    expect(typeof noteEncryption.encryptItemUpdate).toBe("function");
    expect(typeof noteEncryption.decryptItemRow).toBe("function");
    expect(typeof noteEncryption.decryptItemRows).toBe("function");
  });
});
