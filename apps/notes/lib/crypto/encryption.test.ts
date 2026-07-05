import { buildFieldAAD } from "@helvety/shared/crypto/encryption";
import { describe, expect, it } from "vitest";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("notes crypto buildFieldAAD", () => {
  it("builds field-bound AAD for allowed tables", () => {
    expect(buildFieldAAD("notes", VALID_UUID, "encrypted_title")).toBe(
      `notes:${VALID_UUID}:encrypted_title`
    );
    expect(buildFieldAAD("contacts", VALID_UUID, "encrypted_email")).toBe(
      `contacts:${VALID_UUID}:encrypted_email`
    );
  });

  it("rejects disallowed table names", () => {
    expect(() => buildFieldAAD("stages", VALID_UUID, "encrypted_name")).toThrow(
      "Invalid AAD table name"
    );
    expect(() =>
      buildFieldAAD("label_configs", VALID_UUID, "encrypted_name")
    ).toThrow("Invalid AAD table name");
  });

  it("rejects non-UUID record ids", () => {
    expect(() =>
      buildFieldAAD("notes", "not-a-uuid", "encrypted_title")
    ).toThrow("Invalid AAD record ID");
  });
});
