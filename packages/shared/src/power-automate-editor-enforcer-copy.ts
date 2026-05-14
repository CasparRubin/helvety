/**
 * Canonical customer-facing copy for **Power Automate Editor Version Enforcer**.
 * Keep in sync with `power-automate-editor-version-enforcer/public/manifest.json`
 * `description` (verbatim {@link POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY}).
 */

/** Verbatim manifest `description` (Edge/Chrome installed-extensions blurb). Survey Show is implemented in the product but spelled out on store cards via {@link POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX}, not in this line. */
export const POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY =
  "Allows you to enforce either the Classic or New Designer experience in Microsoft Power Automate Cloud Flows using v3=false or v3=true, while also giving you the option to hide the Microsoft survey prompt asking why you made your selection." as const;

/**
 * Appended on store cards / llms after {@link POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY}
 * so Survey-tab **Hide** / **Show** and **Paused** stay explicit (see `store-catalog.test.ts`).
 */
export const POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX =
  "Survey tab: optional v3survey — Hide (default) sets false on rewrites; Show only normalizes when already present. Paused: no URL rewrites while the extension stays installed." as const;

/** Full `StoreProductCard.shortDescription` for this product. */
export const POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION =
  `${POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY} ${POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX}` as const;

/**
 * Fragments for `toContain` against `apps/web` legal TSX (line breaks prevent
 * matching {@link POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION} as one string).
 * Every entry must appear in {@link POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION}.
 */
export const POWER_AUTOMATE_EDITOR_ENFORCER_LEGAL_PAGE_MARKERS = [
  "Microsoft Power Automate Cloud Flows",
  "hide the Microsoft survey prompt asking why you",
  "made your selection",
  "Survey tab: optional",
  "v3survey",
  "Hide (default)",
  "sets false on rewrites",
  "Show only normalizes when already present",
  "Paused: no URL rewrites while the extension stays installed",
] as const;
