/**
 * Task-specific type definitions for the Tasks app
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/** Batch reorder update for drag-and-drop */
export interface ReorderUpdate {
  id: string;
  sort_order: number;
  stage_id?: string | null;
}

// =============================================================================
// ITEM TYPES
// =============================================================================

/**
 * Item row as stored in the database (encrypted fields)
 * Flat item rows (e.g., tasks, issues, bugs)
 */
export interface ItemRow {
  id: string;
  user_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  encrypted_start_date: string | null;
  encrypted_end_date: string | null;
  stage_id: string | null;
  label_id: string | null;
  /** Priority: 0=low, 1=normal, 2=high, 3=urgent */
  priority: number;
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
  /** ISO datetime string, e.g. "2026-02-15T14:30:00.000Z" */
  start_date: string | null;
  /** ISO datetime string, e.g. "2026-02-15T16:00:00.000Z" */
  end_date: string | null;
  stage_id: string | null;
  label_id: string | null;
  /** Priority: 0=low, 1=normal, 2=high, 3=urgent */
  priority: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating an Item (plaintext, encrypted before sending) */
export interface ItemInput {
  title: string;
  description: string | null;
  /** Optional ISO datetime string for the start date/time */
  start_date?: string | null;
  /** Optional ISO datetime string for the end date/time */
  end_date?: string | null;
  /** Optional stage ID - must be one of the built-in immutable item stage IDs. */
  stage_id?: string | null;
  /** Optional label ID - must be one of the built-in immutable item label IDs. */
  label_id?: string | null;
  /** Optional priority (0=low, 1=normal, 2=high, 3=urgent). Defaults to 1 (normal) in DB. */
  priority?: number;
}

// =============================================================================
// STAGE TYPES
// =============================================================================

/** Decrypted Stage (client-side only) */
export interface Stage {
  id: string;
  config_id: string;
  user_id: string;
  name: string;
  color: string | null;
  /** Kebab-case Lucide name for `@helvety/ui/icon-renderer` (e.g. "circle", "check-circle"). */
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
  created_at: string;
}

// =============================================================================
// LABEL TYPES
// =============================================================================

/** Decrypted Label (client-side only) */
export interface Label {
  id: string;
  config_id: string;
  user_id: string;
  name: string;
  color: string | null;
  /** Kebab-case Lucide name for `@helvety/ui/icon-renderer` (e.g. "circle", "bug"). */
  icon: string;
  sort_order: number;
  created_at: string;
}

/** Decrypted Contact (client-side only) for task link pickers. */
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
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DATA EXPORT TYPES
// =============================================================================

/** All encrypted task data for export (decrypted client-side) */
export interface EncryptedTaskExport {
  items: ItemRow[];
}
