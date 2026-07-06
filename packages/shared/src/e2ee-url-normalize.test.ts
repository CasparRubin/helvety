import { describe, expect, it } from "vitest";

import {
  normalizeBookmarkUrl,
  resolveLinkDisplayName,
} from "./e2ee-url-normalize";

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

  it("accepts https://example.com", () => {
    const result = normalizeBookmarkUrl("https://example.com");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe("https://example.com/");
    }
  });
});

describe("resolveLinkDisplayName", () => {
  it("prefers a non-empty name", () => {
    expect(resolveLinkDisplayName("My bookmark", "https://example.com")).toBe(
      "My bookmark"
    );
  });

  it("derives hostname when name is empty", () => {
    expect(resolveLinkDisplayName("", "https://www.example.com/path")).toBe(
      "example.com"
    );
  });
});
