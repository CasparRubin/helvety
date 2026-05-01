/**
 * Store-specific type definitions
 * Types used by server actions that don't belong in entity or product types
 */

// =============================================================================
// DOWNLOAD TYPES
// =============================================================================

/** Download metadata for a software package. */
export interface PackageDownloadInfo {
  /** Signed URL for downloading the package (expires in 60 seconds) */
  downloadUrl: string;
  /** Filename for the download */
  filename: string;
  /** Package version */
  version: string;
}

// =============================================================================
// DATA EXPORT TYPES
// =============================================================================

/** Exported user data structure */
export interface UserDataExport {
  exportedAt: string;
  profile: {
    email: string;
    displayName: string | null;
    createdAt: string;
  };
}
