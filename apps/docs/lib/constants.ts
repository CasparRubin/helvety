/** Maximum .docx size for local open and vault save (20 MB). */
export const MAX_DOCX_BYTES = 20 * 1024 * 1024;

/** Serialized base64 length of a byte payload. */
function base64Length(bytes: number): number {
  return Math.ceil(bytes / 3) * 4;
}

/**
 * Maximum serialized length of `encrypted_docx` accepted by vault actions.
 *
 * The docx bytes are base64-encoded before AES-GCM encryption and the
 * ciphertext is base64-encoded again (~1.78x total expansion), plus the GCM
 * auth tag and the JSON envelope (iv, version, keys/quotes).
 */
export const MAX_ENCRYPTED_DOCX_CHARS =
  base64Length(base64Length(MAX_DOCX_BYTES) + 16) + 256;

/** Maximum vault documents returned per list request. */
export const MAX_DOC_ROWS = 500;
