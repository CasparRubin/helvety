/**
 * Shared layout primitives for app shells.
 * Keeps common font/provider/schema settings in one place.
 */

import { urls } from "./config";

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
