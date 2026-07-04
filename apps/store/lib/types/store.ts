/**
 * Store-specific type definitions (account export and related server-only shapes).
 * Product and package download types live in `lib/types/products.ts` and
 * `lib/packages/create-package-download.ts`.
 */

// =============================================================================
// DATA EXPORT TYPES
// =============================================================================

/** Exported user data structure (Store account settings export). */
export interface UserDataExport {
  exportedAt: string;
  profile: {
    email: string;
    createdAt: string;
  };
}
