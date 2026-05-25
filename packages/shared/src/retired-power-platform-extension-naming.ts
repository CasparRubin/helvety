/**
 * Retired Helvety browser-extension product slugs and display titles.
 * Merged into **Power Platform Configurator**; must not appear in customer-facing copy.
 * Public install is the Chrome Web Store; the `power-platform-configurator` download
 * package id is also retired (404). Negative tests may still reference these strings;
 * see `docs/naming-conventions.md` and `scripts/verify-project-naming.mjs`.
 */

/** One forbidden retired slug or display title plus its detection regex. */
export type RetiredExtensionNamePattern = {
  readonly label: string;
  readonly re: RegExp;
};

/** Canonical forbidden patterns; imported by `scripts/verify-project-naming.mjs`. */
export const RETIRED_HELVETY_EXTENSION_NAME_PATTERNS: readonly RetiredExtensionNamePattern[] =
  [
    {
      label: "legacy store slug editor-preference",
      re: /editor-preference/i,
    },
    {
      label: "legacy repo slug power-automate-v3-false",
      re: /power-automate-v3-false/i,
    },
    {
      label: "legacy repo slug power_automate_v3_false",
      re: /power_automate_v3_false/i,
    },
    {
      label: "legacy package name power-automate-v3-enforcer",
      re: /power-automate-v3-enforcer/i,
    },
    {
      label: 'legacy display title "Power Automate v3 enforcer"',
      re: /Power Automate v3 enforcer/i,
    },
    {
      label: "retired repo slug power-automate-editor-version-enforcer",
      re: /power-automate-editor-version-enforcer/i,
    },
    {
      label: 'retired display title "Power Automate Editor Version Enforcer"',
      re: /Power Automate Editor Version Enforcer/i,
    },
    {
      label: "retired copy module power-automate-editor-enforcer-copy",
      re: /power-automate-editor-enforcer-copy/i,
    },
  ] as const;

/** Repo-relative paths allowed to mention retired slugs (negative tests/docs only). */
export const RETIRED_EXTENSION_NAME_ALLOWLIST_PATHS = [
  "scripts/verify-project-naming.mjs",
  "docs/naming-conventions.md",
  "packages/shared/src/retired-power-platform-extension-naming.ts",
  "apps/store/lib/packages/create-package-download.test.ts",
  "apps/store/lib/packages/config.test.ts",
] as const;
