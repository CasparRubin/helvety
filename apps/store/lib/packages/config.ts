/**
 * Package configuration for downloadable products
 * Maps product IDs to their storage paths and metadata
 */

// =============================================================================
// PACKAGE DEFINITIONS
// =============================================================================

/** Configuration for a downloadable package product */
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
  /** Whether package can be downloaded without purchase checks */
  isPublic: boolean;
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
