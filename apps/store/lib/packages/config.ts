/**
 * Package configuration for downloadable artifacts.
 * Keys are **public download package ids** (segment in `/store/api/packages/{id}/download`),
 * not necessarily the same string as a store catalog card `id`.
 */

/** Configuration for a downloadable package product */
interface PackageInfo {
  /** Display version string. */
  version: string;
  /** Original filename for downloads. */
  filename: string;
  /** Absolute HTTPS URL of the package artifact (GitHub Releases). */
  downloadUrl: string;
  /** Whether package can be downloaded without login. */
  isPublic: boolean;
}

/**
 * Package configuration for all downloadable products.
 * Publish/update the `.sppkg` as a GitHub Release asset on helvety-spo-explorer.
 */
const PACKAGE_CONFIG: Record<string, PackageInfo> = {
  "spo-explorer": {
    version: "1.0.0.4",
    filename: "helvety-spo-explorer.sppkg",
    downloadUrl:
      "https://github.com/CasparRubin/helvety-spo-explorer/releases/latest/download/helvety-spo-explorer.sppkg",
    isPublic: true,
  },
} as const;

/** Returns package info for the given package ID, or undefined if not found */
export function getPackageInfo(packageId: string): PackageInfo | undefined {
  return PACKAGE_CONFIG[packageId];
}
