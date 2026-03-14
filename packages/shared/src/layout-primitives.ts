/**
 * Shared layout primitives for app shells.
 * Keeps common font/provider/schema settings in one place.
 */

import { urls } from "./config";

export const PUBLIC_SANS_LOCAL_FONT_SRC = [
  {
    path: "../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2",
    style: "normal" as const,
  },
  {
    path: "../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-italic.woff2",
    style: "italic" as const,
  },
];

export const DEFAULT_THEME_PROVIDER_PROPS = {
  attribute: "class" as const,
  defaultTheme: "system" as const,
  enableSystem: true,
  disableTransitionOnChange: true,
};

export const HELVETY_SAME_AS_URLS = [
  urls.home,
  urls.auth,
  urls.contacts,
  urls.notes,
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
    description: "Products and apps engineered and designed in Switzerland.",
    sameAs: HELVETY_SAME_AS_URLS,
  };
}
