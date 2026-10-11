/** Formats a byte count for UI labels (e.g. `5.2 MB`, `980 KB`). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    const digits = kb >= 100 ? 0 : 1;
    return `${kb.toFixed(digits)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  const digits = mb >= 10 ? 1 : 2;
  return `${mb.toFixed(digits)} MB`;
}
