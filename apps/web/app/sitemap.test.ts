import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("web sitemap", () => {
  it("returns canonical public pages with metadata", () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(5);
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        "https://helvety.com",
        "https://helvety.com/impressum",
        "https://helvety.com/privacy",
        "https://helvety.com/terms",
        "https://helvety.com/llms.txt",
      ])
    );
    expect(entries.every((entry) => entry.lastModified instanceof Date)).toBe(
      true
    );
  });
});
