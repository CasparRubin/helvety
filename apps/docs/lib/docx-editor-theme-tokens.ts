/**
 * HSL channel strings for `@eigenpal/docx-editor-react` (`.ep-root` uses `hsl(var(--token))`).
 * Values approximate `packages/ui/globals.css` oklch semantic tokens.
 * Update `styles/docx-editor-helvety-bridge.css` when these change.
 */

/** Light UI chrome: maps to `:root` in `packages/ui/globals.css`. */
export const EP_EDITOR_THEME_LIGHT = {
  background: "12.4 49.3% 98.2%",
  foreground: "0 0% 3.9%",
  card: "12.4 26.3% 95%",
  cardForeground: "0 0% 3.9%",
  popover: "12.4 26.3% 95%",
  popoverForeground: "0 0% 3.9%",
  primary: "359.4 100% 44.3%",
  primaryForeground: "240 0% 97.4%",
  secondary: "12.4 15.6% 93%",
  secondaryForeground: "0 0% 9.5%",
  muted: "12.4 11.3% 92.3%",
  mutedForeground: "0 0% 45.2%",
  accent: "12.4 12.1% 91.1%",
  accentForeground: "0 0% 3.9%",
  destructive: "358.9 74.7% 50.3%",
  destructiveForeground: "240 0% 97.4%",
  border: "12.4 8.4% 87.2%",
  input: "12.4 8.4% 87.2%",
  ring: "0 0% 63%",
  /** Matches `--surface-toolbar` in `packages/ui/globals.css` (command bar). */
  surfaceToolbar: "12.4 17% 94.5%",
  radius: "0",
} as const;

/** Dark UI chrome: maps to `.dark` in `packages/ui/globals.css`. */
export const EP_EDITOR_THEME_DARK = {
  background: "11.3 30.2% 4.2%",
  foreground: "180 0% 98%",
  card: "12.4 15.5% 9.3%",
  cardForeground: "180 0% 98%",
  popover: "12.4 15.5% 9.3%",
  popoverForeground: "180 0% 98%",
  primary: "352.5 100% 53.8%",
  primaryForeground: "240 0% 97.4%",
  secondary: "12.4 9.9% 15.7%",
  secondaryForeground: "180 0% 98%",
  muted: "12.4 8.2% 15.2%",
  mutedForeground: "0 0% 63%",
  accent: "12.4 8% 15.7%",
  accentForeground: "180 0% 98%",
  destructive: "358.7 100% 69.6%",
  destructiveForeground: "180 0% 98%",
  border: "12.4 10% 18%",
  input: "12.4 10% 22%",
  ring: "0 0% 45.2%",
  /** Matches `--surface-toolbar` in `packages/ui/globals.css` (command bar). */
  surfaceToolbar: "12.4 12% 8.5%",
  radius: "0",
} as const;

/**
 * Editor chrome `--doc-*` aliases on `.ep-root` (see bridge CSS).
 * Values resolve via semantic HSL channels in light and dark.
 */
export const EP_DOC_CHROME_SEMANTIC = {
  bg: "hsl(var(--background))",
  text: "hsl(var(--foreground))",
  textMuted: "hsl(var(--muted-foreground))",
  textSubtle: "hsl(var(--muted-foreground))",
  textPlaceholder: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
  borderLight: "hsl(var(--border))",
  borderDark: "hsl(var(--input))",
  borderInput: "hsl(var(--input))",
  bgSubtle: "hsl(var(--muted))",
  bgHover: "hsl(var(--accent))",
  bgInput: "hsl(var(--secondary))",
  hover: "var(--doc-bg-hover)",
} as const;

/** Brand accent on `.ep-root` light chrome (toolbar highlights). */
export const EP_DOC_BRAND_LIGHT = {
  primary: "#ff102a",
  primaryHover: "#d90e24",
  primaryLight: "#ffe8eb",
  link: "#0563c1",
} as const;

/** Brand accent on `html.dark .ep-root` chrome. */
export const EP_DOC_BRAND_DARK = {
  primary: "#ff4d5f",
  primaryHover: "#ff102a",
  primaryLight: "#3d1a1f",
  link: "#8ab4f8",
} as const;

/**
 * Document page surface: always paper white with dark text (export fidelity).
 * Re-applied on `.layout-page` so dark chrome doc-* tokens do not leak onto the page.
 */
export const EP_DOC_PAPER = {
  background: "#ffffff",
  text: "#202124",
  textMuted: "#5f6368",
  textSubtle: "#9aa0a6",
  textPlaceholder: "#999999",
  border: "#e0e0e0",
  borderLight: "#dadce0",
  borderDark: "#d0d0d0",
  borderInput: "#cccccc",
  bgSubtle: "#f5f5f5",
  bgHover: "#f1f3f4",
  bgInput: "#f8f9fa",
} as const;
