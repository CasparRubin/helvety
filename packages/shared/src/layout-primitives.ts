/**
 * Shared layout primitives for app shells.
 * Keeps common font/provider/schema settings in one place.
 */

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
  "https://helvety.com",
  "https://helvety.com/auth",
  "https://helvety.com/contacts",
  "https://helvety.com/pdf",
  "https://helvety.com/store",
  "https://helvety.com/tasks",
  "https://github.com/CasparRubin",
];

/** Builds the shared Helvety Organization schema.org JSON object. */
export function createHelvetyOrganizationSchema(logoUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Helvety",
    url: "https://helvety.com",
    logo: logoUrl,
    description:
      "Products and services engineered and designed in Switzerland.",
    sameAs: HELVETY_SAME_AS_URLS,
  };
}
