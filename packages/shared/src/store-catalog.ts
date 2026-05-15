/**
 * Card-level Helvety Store catalog fields shared by @helvety/store listings and
 * @helvety/web marketing. Full Product rows (images, pricing, long copy) stay in the Store app.
 * Power Automate Editor Version Enforcer card blurbs are composed from
 * `./power-automate-editor-enforcer-copy` so they stay aligned with the extension manifest summary.
 */

import { POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION } from "./power-automate-editor-enforcer-copy";

/** Mirrors {@link ProductType} in apps/store without importing Next-specific types. */
export type StoreProductType = "saas" | "software" | "physical";

/** Mirrors store {@link ProductCategory}. */
export type StoreProductCategory =
  | "productivity"
  | "developer-tools"
  | "utilities"
  | "integrations"
  | "other";

/** Fields shown on Store cards and the web gateway landing showcase. */
export interface StoreProductCard {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  /** ISO date YYYY-MM-DD; ties use {@link PRODUCT_RELEASE_TIE_PRIORITY}. */
  releaseDate: string;
  type: StoreProductType;
  category: StoreProductCategory;
  /**
   * Short label for where the product runs (gateway showcase badge).
   * Keep in sync with Store `metadata.platforms` intent.
   */
  runsOn: string;
  /** True when the product has a free tier with no paywalled feature gates. */
  isFree: boolean;
  /** True when the source code is publicly available (e.g. GitHub). */
  isOpenSource: boolean;
}

/**
 * When two products share the same `releaseDate`, higher number sorts first
 * (newer for display when using newest-first sort).
 */
export const PRODUCT_RELEASE_TIE_PRIORITY: Readonly<Record<string, number>> = {
  "helvety-image-upscaler": 8,
  "helvety-screen-tools": 7,
  "helvety-power-automate-editor-version-enforcer": 6,
  "helvety-notes": 5,
  "helvety-contacts": 4,
  "helvety-tasks": 3,
  "helvety-spo-explorer": 2,
  "helvety-pdf": 1,
};

/** Source order: oldest → newest (see tie map). */
export const STORE_PRODUCT_CARDS = [
  {
    id: "helvety-pdf",
    slug: "helvety-pdf",
    name: "Helvety PDF",
    shortDescription:
      "Reorder, merge, rotate, extract, or add images to a PDF. Supported edits stay in your browser, not on Helvety servers.",
    releaseDate: "2025-09-14",
    type: "saas",
    category: "utilities",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-spo-explorer",
    slug: "helvety-spo-explorer",
    name: "Helvety SPO Explorer",
    shortDescription:
      "Jump between SharePoint sites from the header. Favorites and settings stay on your device.",
    releaseDate: "2025-10-05",
    type: "software",
    category: "integrations",
    runsOn: "SharePoint Online",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-tasks",
    slug: "helvety-tasks",
    name: "Helvety Tasks",
    shortDescription:
      "Stage-based task board with encrypted titles, descriptions, and dates. Labels, priority, and optional links to Helvety Contacts.",
    releaseDate: "2025-11-11",
    type: "saas",
    category: "productivity",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-contacts",
    slug: "helvety-contacts",
    name: "Helvety Contacts",
    shortDescription:
      "Encrypted contacts with names, numbers, birthdays, and notes. Personal, Work, and Other groups, drag to reorder, and export when you need a copy.",
    releaseDate: "2025-12-02",
    type: "saas",
    category: "productivity",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-notes",
    slug: "helvety-notes",
    name: "Helvety Notes",
    shortDescription:
      "Encrypted notes with titles and rich text. Group by Personal, Work, or Other, with links to tasks or contacts when you use those apps.",
    releaseDate: "2026-01-20",
    type: "saas",
    category: "productivity",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-power-automate-editor-version-enforcer",
    slug: "helvety-power-automate-editor-version-enforcer",
    name: "Power Automate Editor Version Enforcer",
    shortDescription: POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION,
    releaseDate: "2026-04-03",
    type: "software",
    category: "integrations",
    runsOn: "Edge & Chrome",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-screen-tools",
    slug: "helvety-screen-tools",
    name: "Helvety Screen Tools",
    shortDescription:
      "Windows app for quick screenshots and a see-through drawing layer on top of your desktop.",
    releaseDate: "2026-04-21",
    type: "software",
    category: "utilities",
    runsOn: "Windows 10 & 11",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-image-upscaler",
    slug: "helvety-image-upscaler",
    name: "Helvety Image Upscaler",
    shortDescription:
      "Upscale PNG, JPEG, or WebP in the browser. AI quality when your device supports it, with sensible limits so tabs stay responsive.",
    releaseDate: "2026-04-28",
    type: "saas",
    category: "utilities",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
] as const satisfies readonly StoreProductCard[];

/**
 * Literal union of every product id in {@link STORE_PRODUCT_CARDS}.
 * Use as the key type for exhaustive registries (icons, artwork, copy
 * overrides), so TypeScript catches missing entries when a new product is
 * added to the catalog.
 */
export type StoreProductId = (typeof STORE_PRODUCT_CARDS)[number]["id"];

/**
 * Catalog entry with its literal {@link StoreProductId} preserved (instead of
 * widening `id` to `string`). Returned from listing helpers so consumers can
 * key exhaustive registries directly off `entry.id`.
 */
export type StoreProductCardEntry = (typeof STORE_PRODUCT_CARDS)[number];

const storeCardById: ReadonlyMap<string, StoreProductCard> = new Map(
  STORE_PRODUCT_CARDS.map((c) => [c.id, c])
);

/** Lookup card fields by product id (throws if unknown). */
export function requireStoreProductCard(id: string): StoreProductCard {
  const card = storeCardById.get(id);
  if (!card) {
    throw new Error(`Unknown store product card id: ${id}`);
  }
  return card;
}

/** Newest `releaseDate` first; ties use {@link PRODUCT_RELEASE_TIE_PRIORITY}. */
export function compareStoreCatalogEntriesNewestFirst(
  a: Pick<StoreProductCard, "id" | "releaseDate">,
  b: Pick<StoreProductCard, "id" | "releaseDate">
): number {
  const cmp = b.releaseDate.localeCompare(a.releaseDate);
  if (cmp !== 0) return cmp;
  const pa = PRODUCT_RELEASE_TIE_PRIORITY[a.id] ?? 0;
  const pb = PRODUCT_RELEASE_TIE_PRIORITY[b.id] ?? 0;
  return pb - pa;
}

/**
 * Same ordering as Store `getAllProducts()` default (newest release first).
 * Returns {@link StoreProductCardEntry}[] (literal `id` union preserved) so
 * callers can key off `entry.id` against {@link StoreProductId} registries.
 */
export function getStoreCatalogNewestFirst(): StoreProductCardEntry[] {
  return [...STORE_PRODUCT_CARDS].sort(compareStoreCatalogEntriesNewestFirst);
}

/** Labels aligned with apps/store/components/products/product-badge.tsx `ProductBadge`. */
export const storeProductTypeBadgeLabel: Record<StoreProductType, string> = {
  saas: "Web App",
  software: "Software",
  physical: "Physical",
};

export const storeProductCategoryBadgeLabel: Record<
  StoreProductCategory,
  string
> = {
  productivity: "Productivity",
  "developer-tools": "Developer tools",
  utilities: "Utilities",
  integrations: "Integrations",
  other: "Other",
};
