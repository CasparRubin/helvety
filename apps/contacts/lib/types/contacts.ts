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

// =============================================================================
// LEGACY CATEGORY CONFIGURATION TYPES
// =============================================================================

/**
 * @deprecated Legacy database shape for configurable categories.
 */
export interface CategoryConfigRow {
  id: string;
  user_id: string;
  encrypted_name: string;
  created_at: string;
  updated_at: string;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface CategoryConfig {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** True for hardcoded default configs (not stored in DB) */
  isDefault?: boolean;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface CategoryConfigInput {
  name: string;
}

// =============================================================================
// CATEGORY TYPES
// =============================================================================

/**
 * Category row shape used by fixed in-code categories.
 */
export interface CategoryRow {
  id: string;
  config_id: string;
  user_id: string;
  encrypted_name: string;
  color: string | null;
  /** Lucide icon name (e.g., "circle", "briefcase") */
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
  created_at: string;
}

/** Decrypted Category (client-side only) */
export interface Category {
  id: string;
  config_id: string;
  user_id: string;
  name: string;
  color: string | null;
  /** Lucide icon name (e.g., "circle", "briefcase") */
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
  created_at: string;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface CategoryInput {
  config_id: string;
  name: string;
  color?: string | null;
  /** Lucide icon name (defaults to "circle" if not provided) */
  icon?: string;
  sort_order?: number;
  /** Number of rows to show by default (0 = collapsed, defaults to 20) */
  default_rows_shown?: number;
}

// =============================================================================
// LEGACY CATEGORY ASSIGNMENT TYPES
// =============================================================================

/**
 * @deprecated Legacy type kept for compatibility with historical data contracts.
 */
export interface CategoryAssignment {
  id: string;
  config_id: string;
  user_id: string;
  created_at: string;
}
