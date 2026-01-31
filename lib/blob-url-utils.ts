/**
 * Utilities for managing blob URLs safely.
 * Prevents memory leaks by ensuring URLs are properly revoked.
 */

/**
 * Safely revokes a blob URL if it exists and is valid.
 * Handles errors gracefully (e.g., if URL was already revoked).
 *
 * @param url - The blob URL to revoke, or null/undefined
 *
 * @example
 * ```typescript
 * safeRevokeObjectURL(blobUrl) // Safe even if already revoked
 * safeRevokeObjectURL(null)    // No-op
 * ```
 */
export function safeRevokeObjectURL(url: string | null | undefined): void {
  if (url && typeof url === "string") {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle errors (URL might already be revoked)
    }
  }
}

// NOTE: createBlobURLWithCleanup was removed as it was unused.
// The downloadBlob function in file-download.ts handles URL lifecycle internally.
