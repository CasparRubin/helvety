/**
 *
 */
export type ThemePreference = "light" | "dark";

/** Resolves the initial theme from OS preference (first launch, missing storage, or legacy `"system"`). */
export function defaultThemeFromSystem(): ThemePreference {
  return prefersDarkFromSystem() ? "dark" : "light";
}

/**
 *
 */
export function parseThemePreference(value: unknown): ThemePreference {
  if (value === "light" || value === "dark") {
    return value;
  }
  if (value === "system") {
    return defaultThemeFromSystem();
  }
  return defaultThemeFromSystem();
}

/** If `matchMedia` is missing or throws, returns `true` (dark) when bootstrapping from the system. */
export function prefersDarkFromSystem(): boolean {
  try {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return true;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
}

/**
 *
 */
export function resolveIsDark(preference: ThemePreference): boolean {
  return preference === "dark";
}

/**
 *
 */
export function applyThemeClassToDocument(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}
