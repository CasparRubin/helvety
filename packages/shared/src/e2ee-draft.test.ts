import { describe, expect, it } from "vitest";

import { E2EE_LIST_UNTITLED_LABEL, getE2eeListTitle } from "./e2ee-draft";

describe("e2ee-draft", () => {
  it("getE2eeListTitle returns trimmed title when non-empty", () => {
    expect(getE2eeListTitle("  Hello  ")).toBe("Hello");
  });

  it("getE2eeListTitle uses fallback for blank titles", () => {
    expect(getE2eeListTitle("")).toBe(E2EE_LIST_UNTITLED_LABEL);
    expect(getE2eeListTitle("   ")).toBe(E2EE_LIST_UNTITLED_LABEL);
    expect(getE2eeListTitle("", "Draft")).toBe("Draft");
  });
});
