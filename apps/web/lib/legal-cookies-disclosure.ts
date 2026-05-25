/** App folder names for all ten Next.js zones on helvety.com. */
export const HELVETY_WEB_ZONE_APP_SLUGS = [
  "web",
  "auth",
  "store",
  "pdf",
  "docs",
  "image-upscaler",
  "tasks",
  "contacts",
  "notes",
  "links",
] as const;

/**
 * Product names that must appear in Privacy Policy §9 Vercel Analytics disclosure.
 * Keep aligned with HelvetyVercelAnalytics mounts (all ten Next.js zones on helvety.com),
 * `docs/cookies-telemetry-and-footer.md`, and
 * `packages/ui/src/helvety-layout-analytics-wiring.test.ts` shell app lists.
 */
export const HELVETY_WEB_ANALYTICS_ZONE_NAMES = [
  "main website",
  "Helvety Auth",
  "Helvety Store",
  "Helvety PDF",
  "Helvety Docs",
  "Helvety Image Upscaler",
  "Helvety Tasks",
  "Helvety Contacts",
  "Helvety Notes",
  "Helvety Links",
] as const;

/** Cookie / storage identifiers disclosed in Privacy Policy §9 table. */
export const HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS = [
  "Supabase auth session",
  "csrf_token",
  "webauthn_challenge",
  "helvety_device_trust",
  "Theme preference (localStorage)",
  "helvety-prf-salt (localStorage)",
  "helvety-crypto (IndexedDB)",
  "helvety-pdf-columns (localStorage)",
] as const;
