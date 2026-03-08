/**
 * Contact-specific type definitions for the Contacts app
 */

// =============================================================================
// CONTACT TYPES
// =============================================================================

/** Batch reorder update for drag-and-drop */
export interface ReorderUpdate {
  id: string;
  sort_order: number;
  category_id?: string;
}

/**
 * Contact row as stored in the database (encrypted fields)
 */
export interface ContactRow {
  id: string;
  user_id: string;
  encrypted_first_name: string;
  encrypted_last_name: string;
  encrypted_description: string | null;
  encrypted_email: string | null;
  encrypted_phone: string | null;
  encrypted_birthday: string | null;
  encrypted_notes: string | null;
  category_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Decrypted Contact (client-side only) */
export interface Contact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  /** ISO date string, e.g. "2000-01-15" */
  birthday: string | null;
  notes: string | null;
  category_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating a Contact (plaintext, encrypted before sending) */
export interface ContactInput {
  first_name: string;
  last_name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  /** ISO date string, e.g. "2000-01-15" */
  birthday: string | null;
  notes: string | null;
  category_id?: string;
}
