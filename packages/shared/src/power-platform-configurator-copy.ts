/**
 * Canonical customer-facing copy for **Power Platform Configurator**.
 * Keep in sync with `power-platform-configurator-browser-extension-chromium/public/manifest.json`
 * `description` (verbatim {@link POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY}).
 *
 * Public install is via the Chrome Web Store ({@link POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL}).
 * Store About copy uses shared published-source wording in
 * `apps/store/lib/data/products.ts`. Source and license follow the extension repository `LICENSE`
 * file (see GitHub link on the Store listing). Extension toolbar and popup branding use
 * `ppconfigurator_*` PNGs in the extension repo (`public/icons/`, popup header via `PopupHeader` /
 * `@helvety/extension-chrome`); the Helvety identifier appears only in the popup About
 * **Developer** section.
 */

/** Official Chrome Web Store listing for public install. */
export const POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/power-platform-configurat/mdneakhceachnimmejciaehnfjfabang" as const;

/** Verbatim manifest `description` (Edge/Chrome installed-extensions blurb; max 132 chars). */
export const POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY =
  "Choose classic or new designer for Power Automate flow/run URLs. Control survey flags. Reveal or enable Power Apps form elements." as const;

/** Concise product-page metadata description; intentionally below common search-snippet lengths. */
export const POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION =
  "Choose a Power Automate flow/run designer and survey behavior. Reveal hidden elements or enable disabled controls on model-driven Power Apps forms." as const;

/** Chrome extension manifest `description` maximum length. */
export const POWER_PLATFORM_CONFIGURATOR_MANIFEST_DESCRIPTION_MAX_LENGTH =
  132 as const;

/**
 * Appended on store cards / llms after {@link POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY}
 * so the Power Automate and Power Apps behavior stays explicit (see `store-catalog.test.ts`).
 */
export const POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX =
  "Power Automate: choose Classic Designer, New Designer, or Paused; Hide sets v3survey=false on rewrites, while Show only normalizes an existing parameter. Power Apps: reveal hidden tabs, sections, and controls or enable disabled controls on supported model-driven record forms." as const;

/** Full `StoreProductCard.shortDescription` for this product. */
export const POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION =
  `${POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY} ${POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX}` as const;

/**
 * One-line install pointer for llms.txt and legal pages (includes the listing URL).
 */
export const POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE =
  `Install from the Chrome Web Store: ${POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL}` as const;

/**
 * Fragments for `toContain` against `apps/web` legal TSX (line breaks prevent
 * matching {@link POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION} as one string).
 * Every entry must appear in {@link POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION}.
 */
export const POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS = [
  "Choose classic or new designer",
  "flow/run URLs",
  "Control survey flags",
  "Reveal or enable Power Apps form elements",
  "Classic Designer",
  "New Designer",
  "Paused",
  "v3survey=false",
  "Show only normalizes an existing parameter",
  "hidden tabs, sections, and controls",
  "disabled controls",
  "model-driven record forms",
] as const;
