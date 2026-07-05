import { buildFieldAAD } from "@helvety/shared/crypto/encryption";
import { describe, expect, it } from "vitest";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("links crypto buildFieldAAD", () => {
  it("builds field-bound AAD for allowed tables", () => {
    expect(buildFieldAAD("link_folders", VALID_UUID, "encrypted_name")).toBe(
      `link_folders:${VALID_UUID}:encrypted_name`
    );
    expect(buildFieldAAD("links", VALID_UUID, "encrypted_url")).toBe(
      `links:${VALID_UUID}:encrypted_url`
    );
  });

  it("rejects disallowed table names", () => {
    expect(() => buildFieldAAD("stages", VALID_UUID, "encrypted_name")).toThrow(
      "Invalid AAD table name"
    );
  });

  it("rejects non-UUID record ids", () => {
    expect(() => buildFieldAAD("links", "not-a-uuid", "encrypted_url")).toThrow(
      "Invalid AAD record ID"
    );
  });
});
