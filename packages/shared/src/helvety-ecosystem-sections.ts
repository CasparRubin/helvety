/**
 * Single source of truth for Helvety ecosystem product sections.
 * Drives app-switcher grouping, store category pills, and catalog filters.
 * `Core Apps` (Home, Cloud, Store) stays in the UI layer only; the Store switcher href
 * is `urls.storeProducts` in `@helvety/ui` (not this module). Cloud uses `urls.cloud`.
 */

import { urls } from "./config";

/** Keys on {@link urls} used for web-zone navigation from the app switcher. */
export type HelvetyWebAppUrlKey = Exclude<
  keyof typeof urls,
  "home" | "store" | "storeProducts" | "cloud"
>;

/** Slug union for ecosystem product categories. */
export type HelvetyEcosystemCategorySlug =
  "file-tools" | "browser-extensions" | "sharepoint-apps" | "desktop-apps";

/** One linkable product in the Helvety ecosystem. */
export interface HelvetyEcosystemItem {
  displayName: string;
  storeProductSlug: string;
  webAppUrlKey?: HelvetyWebAppUrlKey;
}

/** One ecosystem product section (app switcher heading + store filter category). */
export interface HelvetyEcosystemSection {
  slug: HelvetyEcosystemCategorySlug;
  title: string;
  items: readonly HelvetyEcosystemItem[];
}

/**
 * Ordered product sections for filters and app-switcher product groups.
 * Edit here when adding or moving products; store categories derive from this.
 */
export const HELVETY_ECOSYSTEM_PRODUCT_SECTIONS = [
  {
    slug: "file-tools",
    title: "File Tools",
    items: [
      {
        displayName: "PDF",
        storeProductSlug: "helvety-pdf",
        webAppUrlKey: "pdf",
      },
      {
        displayName: "Image Editor",
        storeProductSlug: "helvety-image-editor",
        webAppUrlKey: "imageEditor",
      },
      {
        displayName: "OCR",
        storeProductSlug: "helvety-ocr",
        webAppUrlKey: "ocr",
      },
    ],
  },
  {
    slug: "browser-extensions",
    title: "Browser Extensions",
    items: [
      {
        displayName: "Power Platform Configurator",
        storeProductSlug: "helvety-power-platform-configurator",
      },
    ],
  },
  {
    slug: "sharepoint-apps",
    title: "SharePoint Apps",
    items: [
      {
        displayName: "Helvety SPO Explorer",
        storeProductSlug: "helvety-spo-explorer",
      },
    ],
  },
  {
    slug: "desktop-apps",
    title: "Desktop Apps",
    items: [
      {
        displayName: "Helvety Screen Tools",
        storeProductSlug: "helvety-screen-tools",
      },
    ],
  },
] as const satisfies readonly HelvetyEcosystemSection[];

const sectionBySlug = new Map<
  HelvetyEcosystemCategorySlug,
  (typeof HELVETY_ECOSYSTEM_PRODUCT_SECTIONS)[number]
>(HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.map((section) => [section.slug, section]));

const categoryByStoreSlug = new Map<string, HelvetyEcosystemCategorySlug>(
  HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.flatMap((section) =>
    section.items.map((item) => [item.storeProductSlug, section.slug] as const)
  )
);

/** Display title for a category slug (badges, filters, SSR cards). */
export function ecosystemCategoryTitle(
  slug: HelvetyEcosystemCategorySlug
): string {
  const section = sectionBySlug.get(slug);
  if (!section) {
    throw new Error(`Unknown ecosystem category slug: ${slug}`);
  }
  return section.title;
}

/** Category slug for a store product slug (throws if unknown). */
export function ecosystemCategoryForStoreSlug(
  slug: string
): HelvetyEcosystemCategorySlug {
  const category = categoryByStoreSlug.get(slug);
  if (!category) {
    throw new Error(`No ecosystem category for store product slug: ${slug}`);
  }
  return category;
}

/** Flat list of every store product slug in the ecosystem registry. */
export function allEcosystemStoreProductSlugs(): string[] {
  return HELVETY_ECOSYSTEM_PRODUCT_SECTIONS.flatMap((section) =>
    section.items.map((item) => item.storeProductSlug)
  );
}

/** Resolve app-switcher href for an ecosystem item. */
export function ecosystemItemHref(item: HelvetyEcosystemItem): string {
  if (item.webAppUrlKey) {
    return urls[item.webAppUrlKey];
  }
  return `${urls.store}/products/${item.storeProductSlug}`;
}
