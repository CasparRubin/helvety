/**
 * Card-level Helvety Store catalog fields for @helvety/store product cards.
 * Full Product rows (images, pricing, long copy, artwork, artist credit) stay in
 * the Store app; category badge UI is in `apps/store/components/products/product-badge.tsx`.
 * Product categories derive from `@helvety/shared/helvety-ecosystem-sections`.
 * Power Platform Configurator card blurbs are composed from
 * `./power-platform-configurator-copy` so they stay aligned with the Chromium extension manifest
 * (`CasparRubin/power-platform-configurator-browser-extension-chromium`);
 * public install is the Chrome Web Store (see `power-platform-configurator-copy.ts`).
 */

import {
  ecosystemCategoryForStoreSlug,
  type HelvetyEcosystemCategorySlug,
} from "./helvety-ecosystem-sections";
import { POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION } from "./power-platform-configurator-copy";

/** Product delivery model union (`StoreProductType`); imported by `apps/store/lib/types/products.ts` for `Product.type`. */
export type StoreProductType = "saas" | "software" | "physical";

/** Ecosystem category slug (derived from {@link helvety-ecosystem-sections}). */
export type StoreProductCategory = HelvetyEcosystemCategorySlug;

/** Card fields before category is derived from the ecosystem registry. */
type StoreProductCardBase = Omit<StoreProductCard, "category">;

/** Fields shown on Store product cards. */
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
   * Short label for where the product runs (catalog metadata).
   * Store maps this to `metadata.platforms` in `apps/store/lib/data/products.ts`
   * via `platformsFromRunsOn`; not shown on product cards today.
   */
  runsOn: string;
  /** True when the product has a free tier with no paywalled feature gates. */
  isFree: boolean;
  /** True when source is publicly available under an open-source repository license. */
  isOpenSource: boolean;
}

/** Attaches the ecosystem category derived from the card slug. */
function withDerivedCategory(card: StoreProductCardBase): StoreProductCard {
  return {
    ...card,
    category: ecosystemCategoryForStoreSlug(card.slug),
  };
}

/**
 * When two products share the same `releaseDate`, higher number sorts first
 * (newer for display when using newest-first sort).
 */
export const PRODUCT_RELEASE_TIE_PRIORITY: Readonly<Record<string, number>> = {
  "helvety-cloud": 9,
  "helvety-ocr": 8,
  "helvety-image-editor": 8,
  "helvety-screen-tools": 7,
  "helvety-power-platform-configurator": 6,
  "helvety-spo-explorer": 2,
  "helvety-pdf": 1,
};

/** Source order: oldest → newest (see tie map). Category is derived from slug. */
const STORE_PRODUCT_CARDS_BASE = [
  {
    id: "helvety-pdf",
    slug: "helvety-pdf",
    name: "Helvety PDF",
    shortDescription:
      "Reorder, merge, rotate, extract, or add images to a PDF. Supported edits stay in your browser, not on Helvety servers.",
    releaseDate: "2025-09-14",
    type: "saas",
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
    runsOn: "SharePoint Online",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-power-platform-configurator",
    slug: "helvety-power-platform-configurator",
    name: "Power Platform Configurator",
    shortDescription: POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
    releaseDate: "2026-04-03",
    type: "software",
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
    runsOn: "Windows 10 & 11",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-image-editor",
    slug: "helvety-image-editor",
    name: "Helvety Image Editor",
    shortDescription:
      "Annotate PNG, JPEG, and WebP in the browser with text, arrows, borders, spotlight highlights, blur regions, and crop. Adjustable stroke, blur, and corners; layers panel and zoom; edits stay on your device.",
    releaseDate: "2026-07-04",
    type: "saas",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-ocr",
    slug: "helvety-ocr",
    name: "Helvety OCR",
    shortDescription:
      "Extract text from PDFs and images in the browser. Scanned pages run on-device OCR; born-digital PDFs use their text layer first and fall back to OCR when it is insufficient. Read, copy, or download plain text; files stay on your device.",
    releaseDate: "2026-07-11",
    type: "saas",
    runsOn: "Browser",
    isFree: true,
    isOpenSource: true,
  },
  {
    id: "helvety-cloud",
    slug: "helvety-cloud",
    name: "Helvety Cloud",
    shortDescription:
      "Swiss end-to-end encrypted workspace for projects, tasks, notes, contacts, boards, databases, comments, and files. Encrypt on your device; Helvety cannot read or recover your content.",
    releaseDate: "2026-07-28",
    type: "saas",
    runsOn: "Browser",
    isFree: false,
    isOpenSource: true,
  },
] as const satisfies readonly StoreProductCardBase[];

export const STORE_PRODUCT_CARDS =
  STORE_PRODUCT_CARDS_BASE.map(withDerivedCategory);

/**
 * Literal union of every product id in {@link STORE_PRODUCT_CARDS}.
 * Use as the key type for exhaustive registries (icons, artwork, copy
 * overrides), so TypeScript catches missing entries when a new product is
 * added to the catalog.
 */
export type StoreProductId = (typeof STORE_PRODUCT_CARDS_BASE)[number]["id"];

/**
 * Catalog entry with its literal {@link StoreProductId} preserved (instead of
 * widening `id` to `string`). Returned from listing helpers so consumers can
 * key exhaustive registries directly off `entry.id`.
 */
export type StoreProductCardEntry = StoreProductCard & {
  id: StoreProductId;
  slug: (typeof STORE_PRODUCT_CARDS_BASE)[number]["slug"];
};

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

/** Lookup card fields by public product slug (undefined when unknown). */
export function findStoreProductCardBySlug(
  slug: string
): StoreProductCardEntry | undefined {
  const card = STORE_PRODUCT_CARDS.find((c) => c.slug === slug);
  if (!card) {
    return undefined;
  }
  return card as StoreProductCardEntry;
}

/** Newest `releaseDate` first; ties use {@link PRODUCT_RELEASE_TIE_PRIORITY}. */
export function compareStoreCatalogEntriesNewestFirst(
  a: Pick<StoreProductCard, "id" | "releaseDate">,
  b: Pick<StoreProductCard, "id" | "releaseDate">
): number {
  const cmp = b.releaseDate.localeCompare(a.releaseDate);
  if (cmp !== 0) return cmp;
  const pa = PRODUCT_RELEASE_TIE_PRIORITY[a.id];
  const pb = PRODUCT_RELEASE_TIE_PRIORITY[b.id];
  if (pa === undefined || pb === undefined) {
    throw new Error(
      `Missing PRODUCT_RELEASE_TIE_PRIORITY for ${a.id} or ${b.id}`
    );
  }
  return pb - pa;
}

/**
 * Same ordering as Store `getAllProducts()` default (newest release first).
 * Returns {@link StoreProductCardEntry}[] (literal `id` union preserved) so
 * callers can key off `entry.id` against {@link StoreProductId} registries.
 */
export function getStoreCatalogNewestFirst(): StoreProductCardEntry[] {
  return [...STORE_PRODUCT_CARDS]
    .sort(compareStoreCatalogEntriesNewestFirst)
    .map((card) => card as StoreProductCardEntry);
}
