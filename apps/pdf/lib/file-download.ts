import { downloadBlob as downloadBlobShared } from "@helvety/shared/file-download";

import { FILENAME_LIMITS } from "./constants";

/**
 * Downloads a blob as a file with automatic cleanup of the blob URL.
 *
 * Filenames are sanitized to prevent path traversal attacks and other security issues.
 *
 * @param blob - The blob to download
 * @param filename - The filename for the downloaded file (will be sanitized)
 * @param cleanupDelay - Delay in milliseconds before revoking the blob URL (default: 100ms)
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  cleanupDelay: number = 100
): void {
  downloadBlobShared(
    blob,
    filename,
    {
      maxLength: FILENAME_LIMITS.MAX_LENGTH,
      defaultName: FILENAME_LIMITS.DEFAULT_NAME,
    },
    cleanupDelay
  );
}
