/** App folder names for Next.js zones on helvety.com. */
export const HELVETY_WEB_ZONE_APP_SLUGS = [
  "web",
  "store",
  "pdf",
  "image-editor",
  "ocr",
] as const;

/** Cookie / storage identifiers disclosed in Privacy Policy §8 table. */
export const HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS = [
  "Theme preference (localStorage)",
  "helvety-pdf-columns (localStorage)",
  "Supabase Auth session (helvety.cloud)",
] as const;
