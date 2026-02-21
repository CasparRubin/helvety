import { describe, expect, it } from "vitest";

import {
  getSafeRedirectUri,
  getSafeRelativePath,
  isValidRedirectUri,
  isValidRelativePath,
} from "./redirect-validation";

describe("isValidRedirectUri", () => {
  it("rejects null and undefined", () => {
    expect(isValidRedirectUri(null)).toBe(false);
    expect(isValidRedirectUri(undefined)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidRedirectUri("")).toBe(false);
  });

  it("allows https://helvety.com paths", () => {
    expect(isValidRedirectUri("https://helvety.com")).toBe(true);
    expect(isValidRedirectUri("https://helvety.com/auth")).toBe(true);
    expect(isValidRedirectUri("https://helvety.com/store/products")).toBe(true);
  });

  it("rejects http://helvety.com (non-HTTPS)", () => {
    expect(isValidRedirectUri("http://helvety.com")).toBe(false);
  });

  it("rejects unknown domains", () => {
    expect(isValidRedirectUri("https://evil.com")).toBe(false);
    expect(isValidRedirectUri("https://helvety.com.evil.com")).toBe(false);
    expect(isValidRedirectUri("https://nothelvety.com")).toBe(false);
  });

  it("rejects javascript: and data: protocols", () => {
    expect(isValidRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isValidRedirectUri("data:text/html,<h1>pwned</h1>")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidRedirectUri("not-a-url")).toBe(false);
    expect(isValidRedirectUri("://missing-protocol")).toBe(false);
  });
});

describe("getSafeRedirectUri", () => {
  it("returns valid URIs unchanged", () => {
    expect(getSafeRedirectUri("https://helvety.com/auth")).toBe(
      "https://helvety.com/auth"
    );
  });

  it("returns default for invalid URIs", () => {
    expect(getSafeRedirectUri("https://evil.com", "https://helvety.com")).toBe(
      "https://helvety.com"
    );
  });

  it("returns null when no default provided", () => {
    expect(getSafeRedirectUri("https://evil.com")).toBeNull();
  });

  it("returns null for null input with no default", () => {
    expect(getSafeRedirectUri(null)).toBeNull();
  });
});

describe("isValidRelativePath", () => {
  it("allows simple relative paths", () => {
    expect(isValidRelativePath("/")).toBe(true);
    expect(isValidRelativePath("/tasks")).toBe(true);
    expect(isValidRelativePath("/store/products/spo-explorer")).toBe(true);
  });

  it("rejects null and undefined", () => {
    expect(isValidRelativePath(null)).toBe(false);
    expect(isValidRelativePath(undefined)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidRelativePath("")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidRelativePath("//evil.com")).toBe(false);
    expect(isValidRelativePath("//evil.com/path")).toBe(false);
  });

  it("rejects paths with colons (protocol indicators)", () => {
    expect(isValidRelativePath("javascript:alert(1)")).toBe(false);
    expect(isValidRelativePath("/foo:bar")).toBe(false);
  });

  it("rejects paths not starting with /", () => {
    expect(isValidRelativePath("relative/path")).toBe(false);
    expect(isValidRelativePath("https://helvety.com")).toBe(false);
  });
});

describe("getSafeRelativePath", () => {
  it("returns valid paths unchanged", () => {
    expect(getSafeRelativePath("/tasks")).toBe("/tasks");
  });

  it("returns default for invalid paths", () => {
    expect(getSafeRelativePath("//evil.com", "/")).toBe("/");
  });

  it("defaults to / when no default specified", () => {
    expect(getSafeRelativePath(null)).toBe("/");
    expect(getSafeRelativePath(undefined)).toBe("/");
  });
});
