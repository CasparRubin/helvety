import { describe, expect, it } from "vitest";

import {
  buildE2eeDeepLink,
  getContactDeepLink,
  getItemDeepLink,
  getNoteDeepLink,
} from "./e2ee-deep-link";

describe("buildE2eeDeepLink", () => {
  it("builds zone-specific query params", () => {
    expect(buildE2eeDeepLink("tasks", "abc")).toMatch(/\?item=abc$/);
    expect(buildE2eeDeepLink("notes", "abc")).toMatch(/\?note=abc$/);
    expect(buildE2eeDeepLink("contacts", "abc")).toMatch(/\?contact=abc$/);
  });

  it("legacy helpers match buildE2eeDeepLink", () => {
    expect(getNoteDeepLink("x")).toBe(buildE2eeDeepLink("notes", "x"));
    expect(getItemDeepLink("x")).toBe(buildE2eeDeepLink("tasks", "x"));
    expect(getContactDeepLink("x")).toBe(buildE2eeDeepLink("contacts", "x"));
  });
});
