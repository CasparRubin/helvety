/**
 * Note-specific type definitions for the Notes app
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/** Batch reorder update for drag-and-drop */
export interface ReorderUpdate {
  id: string;
  sort_order: number;
  category_id?: string;
}

// =============================================================================
// ITEM TYPES
// =============================================================================

/**
 * One note row as stored in the database (encrypted title/description; plaintext structural fields).
 */
export interface ItemRow {
  id: string;
  user_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  /** Plaintext grouping (not encrypted). */
  category_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Decrypted Item (client-side only) */
export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  /** Plaintext grouping (not encrypted). */
  category_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating an Item (plaintext, encrypted before sending) */
export interface ItemInput {
  title: string;
  description: string | null;
  category_id?: string;
}

// =============================================================================
// CONTACT TYPES (read-only, from the shared contacts table)
// =============================================================================

/**
 * Contact row as stored in the database (encrypted fields).
 * Mirrors the contacts table in the shared Supabase database.
 * The Notes app only reads contacts and never creates or edits them.
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
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Decrypted Contact (client-side only).
 * Note: the notes content is NOT decrypted. Only a `has_notes` flag is exposed.
 */
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
  /** Whether the contact has notes content (flag only, content not decrypted) */
  has_notes: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DATA EXPORT TYPES (nDSG Art. 28, Right to Data Portability)
// =============================================================================

/** All encrypted note data for export (decrypted client-side) */
export interface EncryptedNoteExport {
  items: ItemRow[];
}

// =============================================================================
// TASK LINK TYPES
// =============================================================================

/** Raw note-task link row. */
export interface NoteTaskLinkRow {
  id: string;
  note_id: string;
  item_id: string;
  user_id: string;
  created_at: string;
}

/** Linked task row (encrypted title from the `items` table). */
interface LinkedItemRow {
  id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

/** Linked task list data returned by server action (encrypted title). */
export interface TaskLinkData {
  items: LinkedItemRow[];
}

/** Decrypted linked task for display. */
export interface LinkedItem {
  id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

/** Encrypted task row for picker. */
interface PickerItemRow {
  id: string;
  encrypted_title: string;
}

/** Picker data returned by server action (encrypted title). */
export interface TaskEntitiesData {
  items: PickerItemRow[];
}

/** Decrypted task for picker. */
export interface PickerItem {
  id: string;
  title: string;
}
