import { describe, expect, it } from "vitest";

import { requiresE2eeBrowserUnlock } from "./e2ee-app-paths";

describe("requiresE2eeBrowserUnlock", () => {
  it("returns true for notes, tasks, contacts, and links roots and subpaths", () => {
    expect(requiresE2eeBrowserUnlock("https://helvety.com/notes")).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/notes/")).toBe(true);
    expect(
      requiresE2eeBrowserUnlock("https://helvety.com/notes/item/abc")
    ).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/tasks")).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/tasks/foo")).toBe(
      true
    );
    expect(requiresE2eeBrowserUnlock("https://helvety.com/contacts")).toBe(
      true
    );
    expect(requiresE2eeBrowserUnlock("http://localhost:3001/notes")).toBe(true);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/links")).toBe(true);
    expect(
      requiresE2eeBrowserUnlock("https://helvety.com/links?folder=abc")
    ).toBe(true);
  });

  it("returns false for non-E2EE paths", () => {
    expect(requiresE2eeBrowserUnlock("https://helvety.com/")).toBe(false);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/auth/login")).toBe(
      false
    );
    expect(requiresE2eeBrowserUnlock("https://helvety.com/store")).toBe(false);
    expect(requiresE2eeBrowserUnlock("https://helvety.com/pdf")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(requiresE2eeBrowserUnlock("not a url")).toBe(false);
  });
});
