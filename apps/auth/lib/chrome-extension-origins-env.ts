/**
 * Resolves the Chrome extension origin allowlist from env.
 * Accepts `HELVETY_CHROME_EXTENSION_ORIGINS` (preferred) or the legacy
 * `HELVEETY_CHROME_EXTENSION_ORIGINS` spelling.
 */
export function readChromeExtensionOriginsFromProcessEnv(): string {
  return (
    process.env.HELVETY_CHROME_EXTENSION_ORIGINS?.trim() ??
    process.env.HELVEETY_CHROME_EXTENSION_ORIGINS?.trim() ??
    ""
  );
}
