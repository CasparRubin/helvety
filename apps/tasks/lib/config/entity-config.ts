/**
 * Entity configuration registry for the Tasks app (@helvety/tasks)
 * Centralizes entity metadata for dynamic UI components (e.g., delete confirmations)
 *
 * When adding new entities:
 * 1. Add an entry here with name, plural, childExamples (if any), and hasChildren
 * 2. Update parent entity's childExamples if the new entity is a child
 */

/**
 * Configuration for an entity type
 */
export interface EntityConfig {
  /** Display name (singular) */
  name: string;
  /** Display name (plural) */
  plural: string;
  /** Example child types for delete warning (not exhaustive, just common examples) */
  childExamples?: string[];
  /** Whether this entity can have children/nested content */
  hasChildren: boolean;
}

/**
 * Entity type identifiers
 * Extend this union type when adding new entity types
 */
export type EntityTypeId =
  | "unit"
  | "space"
  | "item"
  | "stageConfig"
  | "stage"
  | "labelConfig"
  | "label";

/**
 * Centralized entity configuration registry
 * Used by DeleteConfirmationDialog and other dynamic UI components
 */
export const ENTITY_CONFIG: Record<EntityTypeId, EntityConfig> = {
  unit: {
    name: "unit",
    plural: "units",
    childExamples: ["spaces", "items"],
    hasChildren: true,
  },
  space: {
    name: "space",
    plural: "spaces",
    childExamples: ["items"],
    hasChildren: true,
  },
  item: {
    name: "item",
    plural: "items",
    hasChildren: false, // Currently leaf node - update when sub-items are added
  },
  stageConfig: {
    name: "stage configuration",
    plural: "stage configurations",
    childExamples: ["stages"],
    hasChildren: true,
  },
  stage: {
    name: "stage",
    plural: "stages",
    hasChildren: false,
  },
  labelConfig: {
    name: "label configuration",
    plural: "label configurations",
    childExamples: ["labels"],
    hasChildren: true,
  },
  label: {
    name: "label",
    plural: "labels",
    hasChildren: false,
  },
};

/**
 * Get entity configuration by type
 * Returns undefined for unknown types (type-safe)
 */
export function getEntityConfig(
  entityType: EntityTypeId
): EntityConfig | undefined {
  return ENTITY_CONFIG[entityType];
}

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
  const config = ENTITY_CONFIG[entityType];

  if (!config) {
    // Fallback for unknown types
    return {
      title: entityName ? `Delete "${entityName}"?` : "Delete this item?",
      description: "This action cannot be undone.",
    };
  }

  // Build title
  const title = entityName
    ? `Delete "${entityName}"?`
    : `Delete this ${config.name}?`;

  // Build description based on whether entity has children
  let description: string;

  if (config.hasChildren) {
    const childList = config.childExamples?.length
      ? config.childExamples.join(", ")
      : "nested content";

    description = `This will permanently delete this ${config.name} and all its contents, including ${childList} and any other nested data. This action cannot be undone.`;
  } else {
    description = `This will permanently delete this ${config.name}. This action cannot be undone.`;
  }

  return { title, description };
}
