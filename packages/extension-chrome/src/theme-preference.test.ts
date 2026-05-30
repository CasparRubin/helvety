import { describe, expect, it } from "vitest";

import {
  applyThemeClassToDocument,
  parseThemePreference,
  resolveIsDark,
} from "./theme-preference";

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
