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
 * Privacy §9 prose snippets for Chromium extension auth ceremonies
 * (OTP + passkey server-side processing; not browser cookies).
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
  "Supabase auth session (chrome.storage.local)",
  "helvety_extension_last_email_verified (chrome.storage.local)",
  "helvety-pdf-columns (localStorage)",
] as const;
