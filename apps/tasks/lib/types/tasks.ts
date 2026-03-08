/**
 * Task-specific type definitions for the Tasks app
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/**
 * Entity type discriminator.
 */
export type EntityType = "item";

/** Type guard to narrow a mixed legacy entity union to Item. */
export function isItem(entity: { id: string }): entity is Item {
  return "priority" in entity && "label_id" in entity;
}

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
// LEGACY STAGE CONFIGURATION TYPES
// =============================================================================

/**
 * Stage configuration row as stored in the database (encrypted fields)
 * A named set of stages that can be applied to entities
 */
export interface StageConfigRow {
  id: string;
  user_id: string;
  encrypted_name: string;
  created_at: string;
  updated_at: string;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface StageConfig {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** True for hardcoded default configs (not stored in DB) */
  isDefault?: boolean;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface StageConfigInput {
  name: string;
}

// =============================================================================
// STAGE TYPES
// =============================================================================

/**
 * @deprecated Legacy database shape for configurable stages.
 */
export interface StageRow {
  id: string;
  config_id: string;
  user_id: string;
  encrypted_name: string;
  color: string | null;
  /** Lucide icon name (e.g., "circle", "check-circle") */
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
  created_at: string;
}

/** Decrypted Stage (client-side only) */
export interface Stage {
  id: string;
  config_id: string;
  user_id: string;
  name: string;
  color: string | null;
  /** Lucide icon name (e.g., "circle", "check-circle") */
  icon: string;
  sort_order: number;
  /** Number of rows to show by default (0 = collapsed) */
  default_rows_shown: number;
  created_at: string;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface StageInput {
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
// LEGACY STAGE ASSIGNMENT TYPES
// =============================================================================

/**
 * @deprecated Legacy type kept for compatibility with historical data contracts.
 */
export interface StageAssignment {
  id: string;
  config_id: string;
  user_id: string;
  entity_type: EntityType;
  parent_id: string | null;
  created_at: string;
}

// =============================================================================
// LEGACY LABEL CONFIGURATION TYPES
// =============================================================================

/**
 * @deprecated Legacy database shape for configurable labels.
 */
export interface LabelConfigRow {
  id: string;
  user_id: string;
  encrypted_name: string;
  created_at: string;
  updated_at: string;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface LabelConfig {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** True for hardcoded default configs (not stored in DB) */
  isDefault?: boolean;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface LabelConfigInput {
  name: string;
}

// =============================================================================
// LABEL TYPES
// =============================================================================

/**
 * Label row shape used by fixed in-code labels.
 */
export interface LabelRow {
  id: string;
  config_id: string;
  user_id: string;
  encrypted_name: string;
  color: string | null;
  /** Lucide icon name (e.g., "circle", "bug") */
  icon: string;
  sort_order: number;
  created_at: string;
}

/** Decrypted Label (client-side only) */
export interface Label {
  id: string;
  config_id: string;
  user_id: string;
  name: string;
  color: string | null;
  /** Lucide icon name (e.g., "circle", "bug") */
  icon: string;
  sort_order: number;
  created_at: string;
}

/** @deprecated Legacy type kept for compatibility with historical data contracts. */
export interface LabelInput {
  config_id: string;
  name: string;
  color?: string | null;
  /** Lucide icon name (defaults to "circle" if not provided) */
  icon?: string;
  sort_order?: number;
}

// =============================================================================
// LEGACY LABEL ASSIGNMENT TYPES
// =============================================================================

/**
 * @deprecated Legacy type kept for compatibility with historical data contracts.
 */
export interface LabelAssignment {
  id: string;
  config_id: string;
  user_id: string;
  /** Legacy parent entity ID this label config was assigned to */
  parent_id: string | null;
  created_at: string;
}

// =============================================================================
// CONTACT TYPES (read-only, from the shared contacts table)
// =============================================================================

/**
 * Contact row as stored in the database (encrypted fields).
 * Mirrors the contacts table in the shared Supabase database.
 * The Tasks app only reads contacts and never creates or edits them.
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

/** All encrypted task data for export (decrypted client-side) */
export interface EncryptedTaskExport {
  items: ItemRow[];
}
