import vm from "node:vm";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME_PROVIDER_PROPS,
  getHelvetyThemeInitScript,
  HELVETY_THEME_STORAGE_KEY,
} from "./layout-primitives";

/** Runs {@link getHelvetyThemeInitScript} in a minimal DOM sandbox. */
function runThemeInitScript(options: {
  storageTheme: string | null;
  prefersDark: boolean;
}): string[] {
  const classes: string[] = [];
  const classList = {
    add(name: string) {
      if (!classes.includes(name)) {
        classes.push(name);
      }
    },
    remove(name: string) {
      const index = classes.indexOf(name);
      if (index >= 0) {
        classes.splice(index, 1);
      }
    },
  };

  vm.runInNewContext(getHelvetyThemeInitScript(), {
    document: { documentElement: { classList } },
    localStorage: {
      getItem: (key: string) => {
        expect(key).toBe(HELVETY_THEME_STORAGE_KEY);
        return options.storageTheme;
      },
    },
    window: {
      matchMedia: (query: string) => ({
        matches:
          query === "(prefers-color-scheme: dark)" && options.prefersDark,
      }),
    },
  });

  return classes;
}

describe("getHelvetyThemeInitScript", () => {
  it("references the shared storage key and default theme", () => {
    const script = getHelvetyThemeInitScript();
    expect(script).toContain(JSON.stringify(HELVETY_THEME_STORAGE_KEY));
    expect(script).toContain(
      JSON.stringify(DEFAULT_THEME_PROVIDER_PROPS.defaultTheme)
    );
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain('classList.add("dark")');
    expect(script).toContain('classList.remove("dark")');
  });

  it("exposes storageKey on DEFAULT_THEME_PROVIDER_PROPS", () => {
    expect(DEFAULT_THEME_PROVIDER_PROPS.storageKey).toBe(
      HELVETY_THEME_STORAGE_KEY
    );
  });

  it("adds dark class for stored dark theme", () => {
    expect(
      runThemeInitScript({ storageTheme: "dark", prefersDark: false })
    ).toEqual(["dark"]);
  });

  it("removes dark class for stored light theme", () => {
    expect(
      runThemeInitScript({ storageTheme: "light", prefersDark: true })
    ).toEqual([]);
  });

  it("follows system preference when theme is system", () => {
    expect(
      runThemeInitScript({ storageTheme: "system", prefersDark: true })
    ).toEqual(["dark"]);
    expect(
      runThemeInitScript({ storageTheme: "system", prefersDark: false })
    ).toEqual([]);
  });

  it("uses default system theme when storage is empty", () => {
    expect(
      runThemeInitScript({ storageTheme: null, prefersDark: true })
    ).toEqual(["dark"]);
    expect(
      runThemeInitScript({ storageTheme: null, prefersDark: false })
    ).toEqual([]);
  });
});
