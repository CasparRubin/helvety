import { describe, expect, it } from "vitest";

import { combinePageTexts, normalizePageText } from "./text-extract";

describe("normalizePageText", () => {
  it("normalizes CRLF, trailing spaces, and excess blank lines", () => {
    const raw = "line one  \r\nline two\n\n\n\nline three   ";
    expect(normalizePageText(raw)).toBe("line one\nline two\n\nline three");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePageText("   hello   ")).toBe("hello");
  });
});

describe("combinePageTexts", () => {
  it("returns an empty string for no pages", () => {
    expect(combinePageTexts([])).toBe("");
  });

  it("returns a single page without separators", () => {
    expect(combinePageTexts(["  only page  "])).toBe("only page");
  });

  it("joins multiple pages with page separators", () => {
    const result = combinePageTexts(["first", "second"]);
    expect(result).toContain("--- Page 1 ---");
    expect(result).toContain("--- Page 2 ---");
    expect(result).toContain("first");
    expect(result).toContain("second");
    expect(result.indexOf("--- Page 1 ---")).toBeLessThan(
      result.indexOf("--- Page 2 ---")
    );
  });
});
