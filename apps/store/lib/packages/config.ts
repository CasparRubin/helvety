/**
 * Package configuration for downloadable artifacts.
 * Keys are **public download package ids** (segment in `/store/api/packages/{id}/download`),
 * not necessarily the same string as a store catalog card `id`.
 */

// =============================================================================
// PACKAGE DEFINITIONS
// =============================================================================

/** Configuration for a downloadable package product */
interface PackageInfo {
  /** Display version fallback (resolver may return file-derived info). */
  version: string;
  /** Original filename for the download */
  filename: string;
  /** Folder in Supabase Storage bucket `packages` that contains package files. */
  storageFolderPath: string;
  /** File extension to match in storage (e.g. ".sppkg", ".zip"), case-insensitive. */
  storageFileSuffix: string;
  /** Helvety store catalog product card `id` (see `@helvety/shared/store-catalog`). */
  productId: string;
  /** Human-readable product name */
  productName: string;
  /** Whether package can be downloaded without account login */
  isPublic: boolean;
}

/**
 * Package configuration for all downloadable products.
 * The download resolver picks the newest matching file in each folder at runtime.
 */
const PACKAGE_CONFIG: Record<string, PackageInfo> = {
  "spo-explorer": {
    version: "1.0.0.4",
    filename: "helvety-spo-explorer.sppkg",
    storageFolderPath: "spfx/helvety-spo-explorer",
    storageFileSuffix: ".sppkg",
    productId: "helvety-spo-explorer",
    productName: "Helvety SPO Explorer",
    isPublic: true,
  },
  "power-platform-configurator": {
    version: "2.8.5",
    filename: "power-platform-configurator.zip",
    storageFolderPath: "browserExtensions/power-platform-configurator",
    storageFileSuffix: ".zip",
    productId: "helvety-power-platform-configurator",
    productName: "Power Platform Configurator",
    isPublic: true,
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Returns package info for the given package ID, or undefined if not found */
export function getPackageInfo(packageId: string): PackageInfo | undefined {
  return PACKAGE_CONFIG[packageId];
}

/** Returns true when package is publicly downloadable. */
export function isPublicPackage(packageId: string): boolean {
  return PACKAGE_CONFIG[packageId]?.isPublic === true;
}
