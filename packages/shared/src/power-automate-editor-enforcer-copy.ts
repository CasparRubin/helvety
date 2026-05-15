/**
 * Canonical customer-facing copy for **Power Automate Editor Version Enforcer**.
 * Keep in sync with `power-automate-editor-version-enforcer/public/manifest.json`
 * `description` (verbatim {@link POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY}).
 */

/** Verbatim manifest `description` (Edge/Chrome installed-extensions blurb). */
export const POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY =
  "Enforce the classic or new designer in Microsoft Power Automate Cloud Flows, and optionally hide the Microsoft survey prompt asking why you made your selection." as const;

/**
 * Appended on store cards / llms after {@link POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY}
 * so Survey-tab **Hide** / **Show** and **Paused** stay explicit (see `store-catalog.test.ts`).
 */
export const POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX =
  "Survey tab: optional v3survey control. Hide (default) sets false on rewrites; Show only normalizes when already present. Paused: no URL rewrites while the extension stays installed." as const;

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
