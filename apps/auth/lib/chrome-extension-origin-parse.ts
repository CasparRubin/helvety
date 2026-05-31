const CHROME_EXTENSION_ORIGIN_PREFIX = "chrome-extension://";

/** Chromium MV3 extension IDs (Chrome, Edge, Brave): 32 chars a–p. */
const CHROMIUM_EXTENSION_ID_RE = /^[a-p]{32}$/;

/** Normalizes one allowlist token to a `chrome-extension://<id>` origin. */
function normalizeChromeExtensionEntry(entry: string): string {
  if (entry.startsWith(CHROME_EXTENSION_ORIGIN_PREFIX)) {
    try {
      const parsed = new URL(entry);
      if (parsed.protocol !== "chrome-extension:" || !parsed.host) {
        throw new Error("invalid chrome-extension URL");
      }
      return entry;
    } catch {
      throw new Error(
        `Chrome extension origin allowlist contains invalid origin: ${entry}`
      );
    }
  }

  if (!CHROMIUM_EXTENSION_ID_RE.test(entry)) {
    throw new Error(
      `Chrome extension allowlist entry must be a 32-character extension id (a-p) or ${CHROME_EXTENSION_ORIGIN_PREFIX}<id>: ${entry}`
    );
  }

  return `${CHROME_EXTENSION_ORIGIN_PREFIX}${entry}`;
}

/**
 * Parse comma-separated Chromium extension allowlist for Zod env validation.
 * Accepts bare extension ids (`kjdldfioiofpblkchjodefakpopmkjjf`) or full
 * `chrome-extension://<id>` origins (legacy).
 */
export function parseChromeExtensionOriginsEnv(raw: string): string[] {
  const entries = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    throw new Error(
      "Chrome extension allowlist must list at least one extension id or chrome-extension:// origin"
    );
  }

  return entries.map(normalizeChromeExtensionEntry);
}
