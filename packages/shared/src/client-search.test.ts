import { describe, expect, it } from "vitest";

import {
  matchesClientSearch,
  normalizeForClientSearch,
  tokenizeClientSearchQuery,
} from "./client-search";

describe("normalizeForClientSearch", () => {
  it("lowercases and trims", () => {
    expect(normalizeForClientSearch("  Hello  ")).toBe("hello");
  });

  it("collapses whitespace", () => {
    expect(normalizeForClientSearch("a \t\n b")).toBe("a b");
  });
});

describe("tokenizeClientSearchQuery", () => {
  it("returns empty for blank query", () => {
    expect(tokenizeClientSearchQuery("")).toEqual([]);
    expect(tokenizeClientSearchQuery("   ")).toEqual([]);
  });

  it("splits on whitespace", () => {
    expect(tokenizeClientSearchQuery("buy milk")).toEqual(["buy", "milk"]);
  });
});

describe("matchesClientSearch", () => {
  it("matches every item when query empty", () => {
    expect(matchesClientSearch(["anything"], "")).toBe(true);
    expect(matchesClientSearch(["anything"], "  ")).toBe(true);
  });

  it("matches substring across combined parts (obile / mobile)", () => {
    expect(matchesClientSearch(["Mobile"], "obile")).toBe(true);
    expect(matchesClientSearch(["Buy", "mobile"], "obile")).toBe(true);
  });

  it("requires all tokens (AND)", () => {
    expect(matchesClientSearch(["john meeting notes"], "john meeting")).toBe(
      true
    );
    expect(matchesClientSearch(["john meeting notes"], "john zoom")).toBe(
      false
    );
  });

  it("is case-insensitive for email-style haystack", () => {
    expect(
      matchesClientSearch(["Jane", "Doe", "Jane@Example.COM"], "example")
    ).toBe(true);
  });
});
