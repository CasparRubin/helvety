import { describe, expect, it } from "vitest";

import { isUuidString } from "./uuid-string";

/** Keeps `entity-links` and server-action ID guards on the same UUID rules. */
describe("isUuidString", () => {
  it("accepts a lowercase version-4 UUID", () => {
    expect(isUuidString("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts uppercase hex", () => {
    expect(isUuidString("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isUuidString("")).toBe(false);
  });

  it("rejects wrong version nibble in third group", () => {
    expect(isUuidString("550e8400-e29b-81d4-a716-446655440000")).toBe(false);
  });

  it("rejects invalid variant nibble", () => {
    expect(isUuidString("550e8400-e29b-41d4-c716-446655440000")).toBe(false);
  });

  it("rejects non-UUID garbage", () => {
    expect(isUuidString("not-a-uuid")).toBe(false);
  });
});
