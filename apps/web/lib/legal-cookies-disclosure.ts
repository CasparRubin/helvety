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
 * Privacy §9 prose snippets for Chromium extension passkey ceremonies
 * (server-side challenge envelopes; not browser cookies).
 */
export const HELVETY_PRIVACY_EXTENSION_PASSKEY_DISCLOSURE_SNIPPETS = [
  "Extension passkey ceremonies:",
  "stored server-side (Upstash",
  "not browser cookies",
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

/**
 * Stale Vercel Analytics / third-party tracking phrases that must not reappear in
 * Privacy §9 or canonical cookie docs after analytics removal.
 */
export const HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES = [
  "Vercel Analytics",
  "Speed Insights",
  "HelvetyVercelAnalytics",
  "HelvetyVercelAnalyticsWithSpeedInsights",
  "NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS",
  "with-speed-insights",
  "vercel.com/docs/analytics",
  "va.vercel-scripts.com",
  "zone-analytics-referer",
  "@vercel/analytics",
  "@vercel/speed-insights",
  "enable Web Analytics",
  "all Helvety web zones served at",
  "selected Helvety web surfaces",
  "privacy-focused analytics",
  "analytics and other storage",
] as const;

/** Additional stale cookie/footer wording in developer docs (not only analytics). */
export const HELVETY_STALE_COOKIE_DOC_PHRASES = [
  "account-based services also use authentication cookies",
  "similar storage technologies for security and core functionality; account-based",
  "Preference cookies:",
] as const;
