const CHROME_EXTENSION_ORIGIN_PREFIX = "chrome-extension://";

/**
 * Parse comma-separated `HELVEETY_CHROME_EXTENSION_ORIGINS` for Zod env validation.
 */
export function parseChromeExtensionOriginsEnv(raw: string): string[] {
  const origins = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error(
      "HELVEETY_CHROME_EXTENSION_ORIGINS must list at least one chrome-extension:// origin"
    );
  }

  for (const origin of origins) {
    if (!origin.startsWith(CHROME_EXTENSION_ORIGIN_PREFIX)) {
      throw new Error(
        `HELVEETY_CHROME_EXTENSION_ORIGINS entries must start with ${CHROME_EXTENSION_ORIGIN_PREFIX}`
      );
    }
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== "chrome-extension:" || !parsed.host) {
        throw new Error("invalid chrome-extension URL");
      }
    } catch {
      throw new Error(
        `HELVEETY_CHROME_EXTENSION_ORIGINS contains invalid origin: ${origin}`
      );
    }
  }

  return origins;
}
