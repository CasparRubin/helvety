/**
 * Doc-specific type definitions for the Docs app vault.
 */

/** One document row as stored in the database (encrypted fields only). */
export interface DocRow {
  id: string;
  user_id: string;
  encrypted_title: string;
  encrypted_docx: string;
  created_at: string;
  updated_at: string;
}

/** Decrypted document (client-side only). */
export interface Doc {
  id: string;
  user_id: string;
  title: string;
  docxBytes: ArrayBuffer;
  created_at: string;
  updated_at: string;
}

/** Metadata for vault list (title decrypted client-side). */
export interface DocListItem {
  id: string;
  title: string;
  updated_at: string;
}

/** Input for creating a vault document (plaintext, encrypted before sending). */
export interface DocInput {
  title: string;
  docxBytes: ArrayBuffer;
}
