/**
 * Sanitizes a filename to prevent path traversal and other security issues.
 * Removes path separators, null bytes, and other dangerous characters.
 * 
 * @param filename - The filename to sanitize
 * @returns A sanitized filename safe for use in downloads
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, '') // Remove path separators and invalid chars
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .trim()
  
  // Limit filename length (Windows has 255 char limit, be conservative)
  const maxLength = 200
  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    const name = sanitized.substring(0, sanitized.lastIndexOf('.'))
    sanitized = name.substring(0, maxLength - ext.length) + ext
  }
  
  // Ensure filename is not empty
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = 'download'
  }
  
  return sanitized
}

/**
 * Downloads a blob as a file with automatic cleanup of the blob URL.
 * 
 * Filenames are sanitized to prevent path traversal attacks and other security issues.
 * 
 * @param blob - The blob to download
 * @param filename - The filename for the downloaded file (will be sanitized)
 * @param cleanupDelay - Delay in milliseconds before revoking the blob URL (default: 100ms)
 */
export function downloadBlob(blob: Blob, filename: string, cleanupDelay: number = 100): void {
  const sanitizedFilename = sanitizeFilename(filename)
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = blobUrl
  link.download = sanitizedFilename
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, cleanupDelay)
}

