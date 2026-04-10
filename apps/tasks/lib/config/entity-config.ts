/**
 * Entity configuration registry for the Tasks app (@helvety/tasks)
 * Centralizes entity metadata for dynamic UI components (e.g., delete confirmations)
 *
 * When adding new entities:
 * 1. Add an entry here with name, plural, childExamples (if any), and hasChildren
 * 2. Update parent entity's childExamples if the new entity is a child
 */

import {
  buildEntityDeleteMessage,
  type EntityDeleteConfig,
} from "@helvety/shared/entity-delete-message";

/**
 * Configuration for an entity type
 */
type EntityConfig = EntityDeleteConfig;

/**
 * Entity type identifiers
 * Extend this union type when adding new entity types
 */
export type EntityTypeId = "item" | "stage" | "label";

/**
 * Centralized entity configuration registry
 * Used by DeleteConfirmationDialog and other dynamic UI components
 */
const ENTITY_CONFIG: Record<EntityTypeId, EntityConfig> = {
  item: {
    name: "task",
    plural: "tasks",
    hasChildren: false, // Currently leaf node - update when sub-items are added
  },
  stage: {
    name: "stage",
    plural: "stages",
    hasChildren: false,
  },
  label: {
    name: "label",
    plural: "labels",
    hasChildren: false,
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
