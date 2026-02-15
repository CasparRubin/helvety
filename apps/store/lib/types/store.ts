/**
 * Store-specific type definitions
 * Types used by server actions that don't belong in entity or product types
 */

// =============================================================================
// AUTH TYPES
// =============================================================================

/**
 * Auth response type for server actions
 */
export type AuthResponse = {
  success: boolean;
  error?: string;
};

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
// DATA EXPORT TYPES (nDSG Art. 28, Right to Data Portability)
// =============================================================================

/** Exported user data structure */
export interface UserDataExport {
  exportedAt: string;
  profile: {
    email: string;
    displayName: string | null;
    createdAt: string;
  };
  subscriptions: Array<{
    productId: string;
    tierId: string;
    status: string;
    createdAt: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }>;
  purchases: Array<{
    productId: string;
    tierId: string;
    amountPaid: number;
    currency: string;
    createdAt: string;
  }>;
  tenants: Array<{
    tenantId: string;
    tenantDomain: string;
    displayName: string | null;
    createdAt: string;
  }>;
}

