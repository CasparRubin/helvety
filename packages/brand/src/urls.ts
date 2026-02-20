/**
 * Absolute URLs for brand assets hosted in the web app's public/ directory.
 *
 * Uses `urls.home` from shared config so:
 * - Dev:  http://localhost:3001/helvety_identifier.png
 * - Prod: https://helvety.com/helvety_identifier.png
 *
 * Use these for metadata (og:image, twitter:image), manifest.json icons,
 * and JSON-LD structured data -- anywhere an absolute URL is required.
 */
import { urls } from "@helvety/shared/config";

export const brandAssets = {
  /** Helvety identifier / icon -- PNG (for og:image, twitter:image) */
  identifierPng: `${urls.home}/helvety_identifier.png`,
} as const;
