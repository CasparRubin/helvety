import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalMatchMedia = window.matchMedia;

/** Replaces `window.matchMedia` with a stub for the duration of a test. */
function stubMatchMedia(value: unknown): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value,
  });
}

describe("theme-boot", () => {
  beforeEach(() => {
    vi.resetModules();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    stubMatchMedia(originalMatchMedia);
  });

  it("adds the dark class when the system prefers dark", async () => {
    stubMatchMedia(vi.fn(() => ({ matches: true })));
    await import("./theme-boot");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes the dark class when the system prefers light", async () => {
    document.documentElement.classList.add("dark");
    stubMatchMedia(vi.fn(() => ({ matches: false })));
    await import("./theme-boot");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("falls back to dark when matchMedia throws", async () => {
    stubMatchMedia(
      vi.fn(() => {
        throw new Error("matchMedia blocked");
      })
    );
    await import("./theme-boot");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
