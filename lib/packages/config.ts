/**
 * Package configuration for downloadable products
 * Maps product IDs to their storage paths and metadata
 */

// =============================================================================
// PACKAGE DEFINITIONS
// =============================================================================

/**
 *
 */
export interface PackageInfo {
  /** Display version (fallback when storagePathPrefix is set and resolver fails) */
  version: string;
  /** Original filename for the download */
  filename: string;
  /** Path in Supabase Storage (bucket: packages); used when storagePathPrefix is not set */
  storagePath: string;
  /**
   * When set, latest version is resolved at runtime by listing this folder in storage.
   * Full path becomes: {storagePathPrefix}/{version}/{filename}
   */
  storagePathPrefix?: string;
  /** Product ID this package belongs to */
  productId: string;
  /** Human-readable product name */
  productName: string;
  /** Minimum required tier IDs that can download this package */
  allowedTiers: string[];
}

/**
 * Package configuration for all downloadable products.
 * For versioned packages (storagePathPrefix set), version and path are resolved at runtime from storage.
 */
export const PACKAGE_CONFIG: Record<string, PackageInfo> = {
  "spo-explorer": {
    version: "1.0.0.4",
    filename: "helvety-spo-explorer.sppkg",
    storagePath: "spo-explorer/helvety-spo-explorer.sppkg",
    storagePathPrefix: "spfx/helvety-spo-explorer",
    productId: "helvety-spo-explorer",
    productName: "Helvety SPO Explorer",
    allowedTiers: [
      "helvety-spo-explorer-basic-monthly",
      "helvety-spo-explorer-enterprise-monthly",
    ],
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get package info by package ID
 * @param packageId
 */
export function getPackageInfo(packageId: string): PackageInfo | undefined {
  return PACKAGE_CONFIG[packageId];
}

/**
 * Check if a tier is allowed to download a package
 * @param packageId
 * @param tierId
 */
export function isTierAllowedForPackage(
  packageId: string,
  tierId: string
): boolean {
  const packageInfo = PACKAGE_CONFIG[packageId];
  if (!packageInfo) return false;
  return packageInfo.allowedTiers.includes(tierId);
}

/**
 * Get all package IDs
 */
export function getAllPackageIds(): string[] {
  return Object.keys(PACKAGE_CONFIG);
}
