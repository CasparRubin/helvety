/**
 * Resolves the Chrome extension origin allowlist from env.
 */
export function readChromeExtensionOriginsFromProcessEnv(): string {
  return process.env.HELVETY_CHROME_EXTENSION_ORIGINS?.trim() ?? "";
}
