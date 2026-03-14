import { describe, expect, it } from "vitest";

import { buildAAD } from "./encryption";
import * as taskEncryption from "./task-encryption";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("tasks crypto buildAAD", () => {
  it("accepts active table names", () => {
    expect(buildAAD("items", VALID_UUID)).toBe(`items:${VALID_UUID}`);
    expect(buildAAD("contacts", VALID_UUID)).toBe(`contacts:${VALID_UUID}`);
    expect(buildAAD("notes", VALID_UUID)).toBe(`notes:${VALID_UUID}`);
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
    expect(() => buildAAD("items", "not-a-uuid")).toThrow(
      "Invalid AAD record ID"
    );
  });
});

describe("tasks task-encryption module surface", () => {
  it("does not expose legacy stage/label helpers", () => {
    expect("encryptStageInput" in taskEncryption).toBe(false);
    expect("decryptStageRow" in taskEncryption).toBe(false);
    expect("encryptLabelInput" in taskEncryption).toBe(false);
    expect("decryptLabelRow" in taskEncryption).toBe(false);
  });
});
