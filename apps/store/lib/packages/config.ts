/**
 * Package configuration for downloadable products
 * Maps product IDs to their storage paths and metadata
 */

// =============================================================================
// PACKAGE DEFINITIONS
// =============================================================================

/** Configuration for a downloadable package product */
export interface PackageInfo {
  /** Display version fallback (resolver may return file-derived info). */
  version: string;
  /** Original filename for the download */
  filename: string;
  /** Folder in Supabase Storage bucket `packages` that contains package files. */
  storageFolderPath: string;
  /** File extension to match in storage (e.g. ".sppkg", ".zip"), case-insensitive. */
  storageFileSuffix: string;
  /** Product ID this package belongs to */
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
  "power-automate-force-v3-false": {
    version: "1.0.0",
    filename: "power-automate-force-v3-false.zip",
    storageFolderPath: "browserExtensions/power-automate-force-v3-false",
    storageFileSuffix: ".zip",
    productId: "helvety-power-automate-force-v3-false",
    productName: "Power Automate Browser Extension",
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
