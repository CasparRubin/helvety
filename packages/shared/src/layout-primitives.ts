/**
 * Shared layout primitives for app shells.
 * Keeps common font/provider/schema settings in one place, including
 * {@link getHelvetyThemeInitScript} for blocking theme init before first paint.
 */

import { urls } from "./config";

/** `next-themes` default `storageKey`; keep in sync with `ThemeProvider`. */
export const HELVETY_THEME_STORAGE_KEY = "theme";

export const DEFAULT_THEME_PROVIDER_PROPS = {
  attribute: "class" as const,
  defaultTheme: "system" as const,
  enableSystem: true,
  disableTransitionOnChange: true,
  storageKey: HELVETY_THEME_STORAGE_KEY,
};

/**
 * Blocking inline script for `<body>` (before paint) so `html.dark` matches
 * `localStorage` / system preference. Mirrors `next-themes` class strategy used
 * with {@link DEFAULT_THEME_PROVIDER_PROPS}.
 */
export function getHelvetyThemeInitScript(): string {
  const storageKey = HELVETY_THEME_STORAGE_KEY;
  const defaultTheme = DEFAULT_THEME_PROVIDER_PROPS.defaultTheme;
  const darkClass = "dark";

  const script = `
(function () {
  try {
    var root = document.documentElement;
    var classList = root.classList;
    var theme = localStorage.getItem(${JSON.stringify(storageKey)});
    var resolved = theme || ${JSON.stringify(defaultTheme)};
    if (resolved === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    if (resolved === "dark") {
      classList.add(${JSON.stringify(darkClass)});
    } else {
      classList.remove(${JSON.stringify(darkClass)});
    }
  } catch (e) {}
})();
`;

  return script.replace(/\s+/g, " ").trim();
}

export const HELVETY_SAME_AS_URLS = [
  urls.home,
  urls.auth,
  urls.contacts,
  urls.notes,
  urls.links,
  urls.pdf,
  urls.store,
  urls.tasks,
  "https://github.com/CasparRubin",
];

/** Builds the shared Helvety Organization schema.org JSON object. */
export function createHelvetyOrganizationSchema(logoUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Helvety",
    url: urls.home,
    logo: logoUrl,
    description:
      "Software products, web apps, browser extensions, and integrations engineered, designed, and made in Switzerland.",
    sameAs: HELVETY_SAME_AS_URLS,
  };
}
