import { describe, expect, it } from "vitest";

import { getLocalAppHref } from "./config";

describe("getLocalAppHref (gateway path helper: not for cross-zone Link inside basePath apps)", () => {
  it("returns local paths unchanged", () => {
    expect(getLocalAppHref("/store")).toBe("/store");
    expect(getLocalAppHref("/notes?tab=all#section")).toBe(
      "/notes?tab=all#section"
    );
  });

  it("converts helvety absolute URLs to root-relative paths", () => {
    expect(getLocalAppHref("https://helvety.com/store")).toBe("/store");
    expect(getLocalAppHref("https://helvety.com/tasks?view=board#top")).toBe(
      "/tasks?view=board#top"
    );
    expect(getLocalAppHref("https://preview.helvety.com/contacts")).toBe(
      "/contacts"
    );
  });

  it("converts localhost gateway URLs to root-relative paths", () => {
    expect(getLocalAppHref("http://localhost:3001/store")).toBe("/store");
    expect(getLocalAppHref("http://127.0.0.1:3001/notes")).toBe("/notes");
  });

  it("keeps external absolute URLs unchanged", () => {
    expect(getLocalAppHref("https://example.com/store")).toBe(
      "https://example.com/store"
    );
  });

  it("falls back to original value for invalid URLs", () => {
    expect(getLocalAppHref("not a valid URL")).toBe("not a valid URL");
  });
});
