import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyThemeClassToDocument,
  defaultThemeFromSystem,
  parseThemePreference,
  prefersDarkFromSystem,
  resolveIsDark,
} from "./theme-preference";

const originalMatchMedia = window.matchMedia;

/** Replaces `window.matchMedia` with a stub for the duration of a test. */
function stubMatchMedia(value: unknown): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value,
  });
}

describe("parseThemePreference", () => {
  it("accepts light and dark", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("defaults unknown values from system", () => {
    const result = parseThemePreference(undefined);
    expect(result === "light" || result === "dark").toBe(true);
  });

  it("defaults invalid stored values from system", () => {
    const result = parseThemePreference("system");
    expect(result === "light" || result === "dark").toBe(true);
  });
});

describe("resolveIsDark", () => {
  it("returns true only for dark", () => {
    expect(resolveIsDark("dark")).toBe(true);
    expect(resolveIsDark("light")).toBe(false);
  });
});

describe("applyThemeClassToDocument", () => {
  it("toggles dark class and color-scheme", () => {
    applyThemeClassToDocument(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    applyThemeClassToDocument(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});

describe("prefersDarkFromSystem", () => {
  afterEach(() => {
    stubMatchMedia(originalMatchMedia);
  });

  it("returns true when matchMedia is unavailable", () => {
    stubMatchMedia(undefined);
    expect(prefersDarkFromSystem()).toBe(true);
  });

  it("reflects a dark system preference", () => {
    stubMatchMedia(vi.fn(() => ({ matches: true })));
    expect(prefersDarkFromSystem()).toBe(true);
  });

  it("reflects a light system preference", () => {
    stubMatchMedia(vi.fn(() => ({ matches: false })));
    expect(prefersDarkFromSystem()).toBe(false);
  });

  it("falls back to dark when matchMedia throws", () => {
    stubMatchMedia(
      vi.fn(() => {
        throw new Error("matchMedia blocked");
      })
    );
    expect(prefersDarkFromSystem()).toBe(true);
  });
});

describe("defaultThemeFromSystem", () => {
  afterEach(() => {
    stubMatchMedia(originalMatchMedia);
  });

  it("maps a dark system preference to dark", () => {
    stubMatchMedia(vi.fn(() => ({ matches: true })));
    expect(defaultThemeFromSystem()).toBe("dark");
  });

  it("maps a light system preference to light", () => {
    stubMatchMedia(vi.fn(() => ({ matches: false })));
    expect(defaultThemeFromSystem()).toBe("light");
  });
});
