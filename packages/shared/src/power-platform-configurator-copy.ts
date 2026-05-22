/**
 * Canonical customer-facing copy for **Power Platform Configurator**.
 * Keep in sync with `power-platform-configurator-browser-extension-chromium/public/manifest.json`
 * `description` (verbatim {@link POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY}).
 *
 * Store About copy uses {@link HELVETY_FREE_AGPL_FEATURE} from `@helvety/shared/licensing`
 * per Helvety product-line policy. The license on the shipped ZIP follows the extension
 * repository `LICENSE` file (see GitHub link on the Store listing). Extension toolbar and
 * popup branding use `ppconfigurator_*` PNGs in the extension repo (`public/icons/`, popup
 * header via `ExtensionMark`); the Helvety identifier appears only in the popup About
 * **Developer** section.
 */

/** Verbatim manifest `description` (Edge/Chrome installed-extensions blurb; max 132 chars). */
export const POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY =
  "Configure Power Automate cloud flows: Classic or New Designer. Hide the survey prompt by default. Pause anytime." as const;

/** Chrome Web Store / Edge Add-ons manifest `description` maximum length. */
export const POWER_PLATFORM_CONFIGURATOR_MANIFEST_DESCRIPTION_MAX_LENGTH =
  132 as const;

/**
 * Appended on store cards / llms after {@link POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY}
 * so Survey-tab **Hide** / **Show** and **Paused** stay explicit (see `store-catalog.test.ts`).
 */
export const POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX =
  "Survey tab: optional v3survey control. Hide (default) sets false on rewrites; Show only normalizes when already present. Paused: no URL rewrites while the extension stays installed." as const;

/** Full `StoreProductCard.shortDescription` for this product. */
export const POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION =
  `${POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY} ${POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX}` as const;

/**
 * Fragments for `toContain` against `apps/web` legal TSX (line breaks prevent
 * matching {@link POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION} as one string).
 * Every entry must appear in {@link POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION}.
 */
export const POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS = [
  "Configure Power Automate cloud flows",
  "Classic or New Designer",
  "Hide the survey prompt",
  "Pause anytime",
  "Survey tab: optional",
  "v3survey",
  "Hide (default)",
  "sets false on rewrites",
  "Show only normalizes when already present",
  "Paused: no URL rewrites while the extension stays installed",
] as const;
