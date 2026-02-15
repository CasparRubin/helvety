import {
  getSafeRedirectUri,
  getSafeRelativePath,
  isValidRedirectUri,
  isValidRelativePath,
} from "@helvety/shared/redirect-validation";
import { describe, expect, it } from "vitest";


// =============================================================================
// isValidRedirectUri
// =============================================================================

describe("isValidRedirectUri", () => {
  it("returns false for null/undefined/empty", () => {
    expect(isValidRedirectUri(null)).toBe(false);
    expect(isValidRedirectUri(undefined)).toBe(false);
    expect(isValidRedirectUri("")).toBe(false);
  });

  it("accepts production helvety.com domains", () => {
    expect(isValidRedirectUri("https://helvety.com")).toBe(true);
    expect(isValidRedirectUri("https://helvety.com/")).toBe(true);
    expect(isValidRedirectUri("https://helvety.com/some/path")).toBe(true);
    expect(isValidRedirectUri("https://auth.helvety.com")).toBe(true);
    expect(isValidRedirectUri("https://store.helvety.com/products")).toBe(true);
    expect(isValidRedirectUri("https://pdf.helvety.com")).toBe(true);
    expect(isValidRedirectUri("https://tasks.helvety.com/units/123")).toBe(
      true
    );
    expect(
      isValidRedirectUri("https://contacts.helvety.com/contacts/456")
    ).toBe(true);
  });

  it("accepts localhost for development", () => {
    expect(isValidRedirectUri("http://localhost")).toBe(true);
    expect(isValidRedirectUri("http://localhost:3000")).toBe(true);
    expect(isValidRedirectUri("http://localhost:3001")).toBe(true);
    expect(isValidRedirectUri("http://localhost:3002/login")).toBe(true);
    expect(isValidRedirectUri("http://127.0.0.1:3000")).toBe(true);
  });

  it("rejects non-helvety domains", () => {
    expect(isValidRedirectUri("https://evil.com")).toBe(false);
    expect(isValidRedirectUri("https://helvety.com.evil.com")).toBe(false);
    expect(isValidRedirectUri("https://nothelvet.com")).toBe(false);
    expect(isValidRedirectUri("https://google.com")).toBe(false);
  });

  it("rejects javascript: and data: protocols", () => {
    expect(isValidRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isValidRedirectUri("data:text/html,<h1>Hi</h1>")).toBe(false);
  });

  it("rejects mixed-case protocol attacks", () => {
    expect(isValidRedirectUri("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isValidRedirectUri("JAVASCRIPT:alert(1)")).toBe(false);
    expect(isValidRedirectUri("DATA:text/html,<h1>Hi</h1>")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidRedirectUri("not-a-url")).toBe(false);
    expect(isValidRedirectUri("://missing-protocol")).toBe(false);
  });

  it("rejects HTTP for production domains (requires HTTPS)", () => {
    expect(isValidRedirectUri("http://helvety.com")).toBe(false);
    expect(isValidRedirectUri("http://auth.helvety.com")).toBe(false);
  });

  it("rejects whitespace-only and padded input", () => {
    expect(isValidRedirectUri("   ")).toBe(false);
    expect(isValidRedirectUri("\t")).toBe(false);
    expect(isValidRedirectUri("\n")).toBe(false);
  });

  it("rejects backslash-based bypass attempts", () => {
    expect(isValidRedirectUri("https://evil.com\\@helvety.com")).toBe(false);
  });

  it("accepts additional localhost variants for development", () => {
    expect(isValidRedirectUri("http://localhost:3001")).toBe(true);
    expect(isValidRedirectUri("http://localhost:3002")).toBe(true);
    expect(isValidRedirectUri("http://127.0.0.1")).toBe(true);
    expect(isValidRedirectUri("http://127.0.0.1:3001")).toBe(true);
    expect(isValidRedirectUri("http://127.0.0.1:3002")).toBe(true);
  });
});

// =============================================================================
// getSafeRedirectUri
// =============================================================================

describe("getSafeRedirectUri", () => {
  it("returns valid URI when valid", () => {
    expect(getSafeRedirectUri("https://helvety.com")).toBe(
      "https://helvety.com"
    );
  });

  it("returns null for invalid URI with no default", () => {
    expect(getSafeRedirectUri("https://evil.com")).toBeNull();
    expect(getSafeRedirectUri(null)).toBeNull();
  });

  it("returns default URI when provided and input is invalid", () => {
    expect(getSafeRedirectUri("https://evil.com", "https://helvety.com")).toBe(
      "https://helvety.com"
    );
  });

  it("returns null when default is also null", () => {
    expect(getSafeRedirectUri(null, null)).toBeNull();
  });
});

// =============================================================================
// isValidRelativePath
// =============================================================================

describe("isValidRelativePath", () => {
  it("returns false for null/undefined/empty", () => {
    expect(isValidRelativePath(null)).toBe(false);
    expect(isValidRelativePath(undefined)).toBe(false);
    expect(isValidRelativePath("")).toBe(false);
  });

  it("accepts valid relative paths", () => {
    expect(isValidRelativePath("/")).toBe(true);
    expect(isValidRelativePath("/login")).toBe(true);
    expect(isValidRelativePath("/products/123")).toBe(true);
    expect(isValidRelativePath("/account")).toBe(true);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidRelativePath("//evil.com")).toBe(false);
  });

  it("rejects paths with protocol indicators", () => {
    expect(isValidRelativePath("/javascript:alert(1)")).toBe(false);
    expect(isValidRelativePath("/data:text")).toBe(false);
  });

  it("rejects paths not starting with /", () => {
    expect(isValidRelativePath("login")).toBe(false);
    expect(isValidRelativePath("https://helvety.com")).toBe(false);
  });

  it("rejects backslash-prefixed paths", () => {
    expect(isValidRelativePath("\\evil.com")).toBe(false);
  });

  it("accepts paths with query strings and fragments", () => {
    expect(isValidRelativePath("/search?q=test")).toBe(true);
    expect(isValidRelativePath("/page#section")).toBe(true);
  });
});

// =============================================================================
// getSafeRelativePath
// =============================================================================

describe("getSafeRelativePath", () => {
  it("returns valid path when valid", () => {
    expect(getSafeRelativePath("/login")).toBe("/login");
  });

  it("returns default '/' for invalid path", () => {
    expect(getSafeRelativePath("//evil.com")).toBe("/");
    expect(getSafeRelativePath(null)).toBe("/");
  });

  it("returns custom default path when provided", () => {
    expect(getSafeRelativePath(null, "/home")).toBe("/home");
    expect(getSafeRelativePath("//evil.com", "/dashboard")).toBe("/dashboard");
  });
});
