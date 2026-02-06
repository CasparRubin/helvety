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
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating an Item (plaintext, encrypted before sending) */
export interface ItemInput {
  space_id: string;
  title: string;
  description: string | null;
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
