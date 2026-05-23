/** Normalize docx-editor `save()` output to a standalone ArrayBuffer. */
export function normalizeDocxSaveResult(
  saved: ArrayBuffer | Uint8Array | null | undefined
): ArrayBuffer | null {
  if (!saved) {
    return null;
  }
  if (saved instanceof ArrayBuffer) {
    return saved;
  }
  return saved.buffer.slice(
    saved.byteOffset,
    saved.byteOffset + saved.byteLength
  ) as ArrayBuffer;
}
