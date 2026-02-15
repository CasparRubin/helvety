/**
 * Lossless Compression Utilities
 *
 * Provides gzip compression/decompression for file attachments using the
 * browser-native CompressionStream/DecompressionStream API.
 *
 * Compression is applied BEFORE encryption (compressed data encrypts to a
 * smaller ciphertext) and decompression happens AFTER decryption.
 *
 * Already-compressed file formats (JPEG, PNG, ZIP, PDF, etc.) are skipped
 * since they won't benefit and would waste CPU cycles.
 */

/** Minimum file size (in bytes) worth compressing. Below this threshold the
 *  gzip header overhead negates any savings. */
const MIN_COMPRESS_SIZE = 1024; // 1 KB

/**
 * MIME type prefixes and exact types that are already compressed internally.
 * Compressing these again yields ~0-2 % savings at best.
 */
const INCOMPRESSIBLE_PREFIXES = ["image/", "video/", "audio/"] as const;

const INCOMPRESSIBLE_TYPES = new Set([
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/x-bzip2",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-xz",
  "application/zstd",
  // Documents (internally ZIP-based)
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.oasis.opendocument.text", // .odt
  "application/vnd.oasis.opendocument.spreadsheet", // .ods
  "application/vnd.oasis.opendocument.presentation", // .odp
  // Other pre-compressed
  "application/wasm",
]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determine whether a file should be compressed before encryption.
 *
 * Returns `false` for:
 * - Files smaller than 1 KB (gzip overhead not worthwhile)
 * - MIME types that are already compressed (images, video, audio, archives,
 *   Office / ODF documents, PDF, etc.)
 *
 * @param mimeType - The file's MIME type (e.g. "text/plain")
 * @param size     - The file size in bytes
 */
export function shouldCompress(mimeType: string, size: number): boolean {
  if (size < MIN_COMPRESS_SIZE) return false;

  const lower = mimeType.toLowerCase();

  for (const prefix of INCOMPRESSIBLE_PREFIXES) {
    if (lower.startsWith(prefix)) return false;
  }

  if (INCOMPRESSIBLE_TYPES.has(lower)) return false;

  return true;
}

/**
 * Compress an ArrayBuffer using gzip (lossless).
 *
 * Uses the browser-native `CompressionStream` API.
 */
export async function compressBuffer(data: ArrayBuffer): Promise<ArrayBuffer> {
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  void writer.write(new Uint8Array(data));
  void writer.close();

  return collectStream(cs.readable);
}

/**
 * Decompress a gzip-compressed ArrayBuffer back to its original form.
 *
 * Uses the browser-native `DecompressionStream` API.
 */
export async function decompressBuffer(
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  void writer.write(new Uint8Array(data));
  void writer.close();

  return collectStream(ds.readable);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Read all chunks from a ReadableStream and concatenate into a single ArrayBuffer. */
async function collectStream(
  stream: ReadableStream<Uint8Array>
): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.byteLength;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result.buffer;
}
