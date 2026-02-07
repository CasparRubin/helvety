/**
 * Task-specific type definitions for helvety-tasks
 * These types are local to this repo and NOT synced via sync-shared.js
 */

// =============================================================================
// ENTITY TYPES (shared pattern for Units, Spaces, Items)
// =============================================================================

/** Entity type discriminator */
export type EntityType = "unit" | "space" | "item";

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
