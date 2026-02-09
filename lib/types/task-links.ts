/**
 * Task link type definitions for cross-app integration with helvety-tasks.
 *
 * The Contacts app reads task entity links (read-only) from the shared
 * `entity_contact_links` junction table. These types represent the data
 * returned by the server action (encrypted) and the decrypted entities
 * used for display.
 */

// =============================================================================
// ENTITY TYPES (matching helvety-tasks entity_type enum)
// =============================================================================

/**
 *
 */
export type TaskEntityType = "unit" | "space" | "item";

// =============================================================================
// DATABASE ROWS (encrypted, from server action)
// =============================================================================

/**
 * Raw entity_contact_links row as stored in the database.
 * Used internally by the server action; not exposed to the UI directly.
 */
export interface EntityContactLinkRow {
  id: string;
  entity_type: TaskEntityType;
  entity_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

/** Linked unit row (encrypted title from the `units` table) */
export interface LinkedUnitRow {
  id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

/** Linked space row (encrypted title + parent unit_id from the `spaces` table) */
export interface LinkedSpaceRow {
  id: string;
  unit_id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

/** Linked item row (encrypted title + parent IDs from the `items` + `spaces` tables) */
export interface LinkedItemRow {
  id: string;
  space_id: string;
  /** Resolved from the parent space's unit_id */
  unit_id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

/**
 * Grouped task link data returned by the server action.
 * All title fields are still encrypted and must be decrypted client-side.
 */
export interface TaskLinkData {
  units: LinkedUnitRow[];
  spaces: LinkedSpaceRow[];
  items: LinkedItemRow[];
}

// =============================================================================
// DECRYPTED ENTITIES (client-side only, for display)
// =============================================================================

/** Decrypted linked unit for display */
export interface LinkedUnit {
  id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

/** Decrypted linked space for display (includes unit_id for deep link) */
export interface LinkedSpace {
  id: string;
  unit_id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

/** Decrypted linked item for display (includes parent IDs for deep link) */
export interface LinkedItem {
  id: string;
  space_id: string;
  unit_id: string;
  title: string;
  link_id: string;
  linked_at: string;
}
