/**
 * Absolute URLs for brand assets hosted in the web app's public/ directory.
 *
 * Uses `urls.home` from shared config so:
 * - Dev:  http://localhost:3001/helvety_identifier.svg
 * - Prod: https://helvety.com/helvety_identifier.svg
 *
 * Use these for metadata (og:image, twitter:image), manifest.json icons,
 * and JSON-LD structured data -- anywhere an absolute URL is required.
 */
import { urls } from "@helvety/shared/config";

export const brandAssets = {
  /** Absolute URL for the Helvety identifier logo (SVG). */
  identifierLogo: `${urls.home}/helvety_identifier.svg`,
} as const;
