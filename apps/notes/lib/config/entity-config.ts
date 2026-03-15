/**
 * Entity configuration registry for the Notes app (@helvety/notes).
 * Notes currently exposes delete messaging for note items only.
 */

import {
  buildEntityDeleteMessage,
  type EntityDeleteConfig,
} from "@helvety/shared/entity-delete-message";

/**
 * Configuration for an entity type
 */
export type EntityConfig = EntityDeleteConfig;

/**
 * Entity type identifiers used by Notes delete messaging.
 */
export type EntityTypeId = "item";

/**
 * Centralized entity configuration registry
 * Used by DeleteConfirmationDialog and other dynamic UI components
 */
export const ENTITY_CONFIG: Record<EntityTypeId, EntityConfig> = {
  item: {
    name: "note",
    plural: "notes",
    hasChildren: false, // Currently leaf node - update when sub-items are added
  },
};

/**
 * Build a delete confirmation message for an entity
 * @param entityType - The type of entity being deleted
 * @param entityName - Optional specific name of the entity
 * @returns Object with title and description for the confirmation dialog
 */
export function buildDeleteMessage(
  entityType: EntityTypeId,
  entityName?: string
): { title: string; description: string } {
  return buildEntityDeleteMessage(ENTITY_CONFIG, entityType, entityName);
}
