/**
 * Entity configuration registry for the Contacts app (@helvety/contacts)
 * Centralizes entity metadata for dynamic UI components (e.g., delete confirmations)
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
 */
export type EntityTypeId = "contact";

/**
 * Centralized entity configuration registry
 */
const ENTITY_CONFIG: Record<EntityTypeId, EntityConfig> = {
  contact: {
    name: "contact",
    plural: "contacts",
    hasChildren: false,
  },
};

/**
 * Build a delete confirmation message for an entity
 */
export function buildDeleteMessage(
  entityType: EntityTypeId,
  entityName?: string
): { title: string; description: string } {
  return buildEntityDeleteMessage(ENTITY_CONFIG, entityType, entityName);
}
