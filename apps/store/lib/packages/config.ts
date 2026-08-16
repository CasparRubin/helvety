/**
 * Package configuration for downloadable artifacts.
 * Keys are **public download package ids** (segment in `/store/api/packages/{id}/download`),
 * not necessarily the same string as a store catalog card `id`.
 */

const SUPABASE_PACKAGES_PUBLIC_BASE =
  "https://qnoeiurmyyyuawkcifmw.supabase.co/storage/v1/object/public/packages";

/** Configuration for a downloadable package product */
interface PackageInfo {
  /** Display version string. */
  version: string;
  /** Original filename for downloads. */
  filename: string;
  /** Absolute HTTPS URL of the package artifact (GitHub Releases or public Supabase Storage). */
  downloadUrl: string;
  /** Whether package can be downloaded without login. */
  isPublic: boolean;
}

/**
 * Package configuration for all downloadable products.
 * SPO Explorer `.sppkg` is a GitHub Release asset. Helvety Power Platform Tools
 * zips are public objects in the Helvety Cloud Supabase `packages` bucket.
 */
const PACKAGE_CONFIG: Record<string, PackageInfo> = {
  "spo-explorer": {
    version: "1.0.0.4",
    filename: "helvety-spo-explorer.sppkg",
    downloadUrl:
      "https://github.com/CasparRubin/helvety-spo-explorer/releases/latest/download/helvety-spo-explorer.sppkg",
    isPublic: true,
  },
  "power-platform-tools": {
    version: "1.0.0",
    filename: "Helvety-Power-Platform-Tools-win64.zip",
    downloadUrl: `${SUPABASE_PACKAGES_PUBLIC_BASE}/power-platform-tools/Helvety-Power-Platform-Tools-win64.zip`,
    isPublic: true,
  },
  "flow-explorer": {
    version: "1.0.0",
    filename: "helvety-flow-explorer.zip",
    downloadUrl: `${SUPABASE_PACKAGES_PUBLIC_BASE}/flow-explorer/helvety-flow-explorer.zip`,
    isPublic: true,
  },
} as const;

/** Returns package info for the given package ID, or undefined if not found */
export function getPackageInfo(packageId: string): PackageInfo | undefined {
  return PACKAGE_CONFIG[packageId];
}
