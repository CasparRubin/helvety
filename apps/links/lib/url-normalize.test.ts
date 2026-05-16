import { describe, expect, it } from "vitest";

import { normalizeBookmarkUrl } from "./url-normalize";

describe("normalizeBookmarkUrl", () => {
  it("adds https when scheme missing", () => {
    const result = normalizeBookmarkUrl("example.com/path");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe("https://example.com/path");
    }
  });

  it("rejects non-http schemes", () => {
    expect(normalizeBookmarkUrl("javascript:alert(1)").ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(normalizeBookmarkUrl("  ").ok).toBe(false);
  });
});
