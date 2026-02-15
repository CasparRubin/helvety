/**
 * Task-specific type definitions for the Tasks app
 */

// =============================================================================
// ENTITY TYPES (shared pattern for Units, Spaces, Items)
// =============================================================================

/** Entity type discriminator */
export type EntityType = "unit" | "space" | "item";

/** Type guard to narrow a union entity (Unit | Space | Item) to Item */
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
// UNIT TYPES
// =============================================================================

/**
 * Unit row as stored in the database (encrypted fields)
 * Units are the top-level organizational containers (e.g., organizations)
 */
export interface UnitRow {
  id: string;
  user_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Decrypted Unit (client-side only) */
export interface Unit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  stage_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating a Unit (plaintext, encrypted before sending) */
export interface UnitInput {
  title: string;
  description: string | null;
  /** Optional stage ID - can be a UUID (custom) or default stage ID (e.g., "default-unit-work") */
  stage_id?: string | null;
}

// =============================================================================
// SPACE TYPES
// =============================================================================

/**
 * Space row as stored in the database (encrypted fields)
 * Spaces belong to a Unit (e.g., teams within an organization)
 */
export interface SpaceRow {
  id: string;
  unit_id: string;
  user_id: string;
  encrypted_title: string;
  encrypted_description: string | null;
  stage_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Decrypted Space (client-side only) */
export interface Space {
  id: string;
  unit_id: string;
  user_id: string;
  title: string;
  description: string | null;
  stage_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating a Space (plaintext, encrypted before sending) */
export interface SpaceInput {
  unit_id: string;
  title: string;
  description: string | null;
  /** Optional stage ID - can be a UUID (custom) or default stage ID (e.g., "default-space-upcoming") */
  stage_id?: string | null;
}

// =============================================================================
// ITEM TYPES
// =============================================================================

/**
 * Item row as stored in the database (encrypted fields)
 * Items belong to a Space (e.g., tasks, issues, bugs)
 */
export interface ItemRow {
  id: string;
  space_id: string;
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
  space_id: string;
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
  space_id: string;
  title: string;
  description: string | null;
  /** Optional ISO datetime string for the start date/time */
  start_date?: string | null;
  /** Optional ISO datetime string for the end date/time */
  end_date?: string | null;
  /** Optional stage ID - can be a UUID (custom) or default stage ID (e.g., "default-item-backlog") */
  stage_id?: string | null;
  /** Optional label ID - can be a UUID (custom) or default label ID (e.g., "default-label-bug") */
  label_id?: string | null;
  /** Optional priority (0=low, 1=normal, 2=high, 3=urgent). Defaults to 1 (normal) in DB. */
  priority?: number;
}

// =============================================================================
// STAGE CONFIGURATION TYPES
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

/** Decrypted StageConfig (client-side only) */
export interface StageConfig {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** True for hardcoded default configs (not stored in DB) */
  isDefault?: boolean;
}

/** Input for creating a StageConfig (plaintext, encrypted before sending) */
export interface StageConfigInput {
  name: string;
}

// =============================================================================
// STAGE TYPES
// =============================================================================

/**
 * Stage row as stored in the database (encrypted fields)
 * An individual stage within a StageConfig (e.g., "To Do", "In Progress")
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

/** Input for creating a Stage (plaintext, encrypted before sending) */
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
// STAGE ASSIGNMENT TYPES
// =============================================================================

/**
 * Links a stage configuration to a specific entity type context
 * (e.g., "use this config for spaces within unit X")
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
// LABEL CONFIGURATION TYPES
// =============================================================================

/**
 * Label configuration row as stored in the database (encrypted fields)
 * A named set of labels that can be applied to items within a space
 */
export interface LabelConfigRow {
  id: string;
  user_id: string;
  encrypted_name: string;
  created_at: string;
  updated_at: string;
}

/** Decrypted LabelConfig (client-side only) */
export interface LabelConfig {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** True for hardcoded default configs (not stored in DB) */
  isDefault?: boolean;
}

/** Input for creating a LabelConfig (plaintext, encrypted before sending) */
export interface LabelConfigInput {
  name: string;
}

// =============================================================================
// LABEL TYPES
// =============================================================================

/**
 * Label row as stored in the database (encrypted fields)
 * An individual label within a LabelConfig (e.g., "Bug", "Feature")
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

/** Input for creating a Label (plaintext, encrypted before sending) */
export interface LabelInput {
  config_id: string;
  name: string;
  color?: string | null;
  /** Lucide icon name (defaults to "circle" if not provided) */
  icon?: string;
  sort_order?: number;
}

// =============================================================================
// LABEL ASSIGNMENT TYPES
// =============================================================================

/**
 * Links a label configuration to a specific space's items
 * (e.g., "use this label config for items within space X")
 */
export interface LabelAssignment {
  id: string;
  config_id: string;
  user_id: string;
  /** The space ID this label config is assigned to */
  parent_id: string | null;
  created_at: string;
}

// =============================================================================
// ATTACHMENT TYPES
// =============================================================================

/** Attachment metadata (plaintext, client-side only after decryption) */
export interface AttachmentMetadata {
  /** Original filename (e.g., "photo.jpg") */
  filename: string;
  /** MIME type (e.g., "image/jpeg") */
  mime_type: string;
  /** File size in bytes */
  size: number;
  /** Whether the file binary was gzip-compressed before encryption.
   *  Missing / false means uncompressed (backward-compatible with existing attachments). */
  compressed?: boolean;
}

/**
 * Attachment row as stored in the database (encrypted metadata)
 * The actual file blob is stored in Supabase Storage as an encrypted binary.
 */
export interface AttachmentRow {
  id: string;
  item_id: string;
  user_id: string;
  /** Path in the Supabase Storage bucket (e.g., "{user_id}/{attachment_id}") */
  storage_path: string;
  /** AES-256-GCM encrypted JSON string containing AttachmentMetadata */
  encrypted_metadata: string;
  sort_order: number;
  created_at: string;
}

/** Decrypted attachment (client-side only) */
export interface Attachment {
  id: string;
  item_id: string;
  user_id: string;
  /** Path in the Supabase Storage bucket */
  storage_path: string;
  /** Decrypted file metadata */
  metadata: AttachmentMetadata;
  sort_order: number;
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
  category_id: string | null;
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
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ENTITY CONTACT LINK TYPES
// =============================================================================

/**
 * Junction table row linking a contact to a task entity (unit, space, or item).
 */
export interface EntityContactLinkRow {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

// =============================================================================
// DATA EXPORT TYPES (nDSG Art. 28, Right to Data Portability)
// =============================================================================

/** All encrypted task data for export (decrypted client-side) */
export interface EncryptedTaskExport {
  units: UnitRow[];
  spaces: SpaceRow[];
  items: ItemRow[];
}
