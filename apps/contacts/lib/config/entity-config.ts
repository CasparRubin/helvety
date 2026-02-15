/**
 * Entity configuration registry for the Contacts app (@helvety/contacts)
 * Centralizes entity metadata for dynamic UI components (e.g., delete confirmations)
 */

/**
 * Configuration for an entity type
 */
export interface EntityConfig {
  /** Display name (singular) */
  name: string;
  /** Display name (plural) */
  plural: string;
  /** Example child types for delete warning */
  childExamples?: string[];
  /** Whether this entity can have children/nested content */
  hasChildren: boolean;
}

/**
 * Entity type identifiers
 */
export type EntityTypeId = "contact" | "categoryConfig" | "category";

/**
 * Centralized entity configuration registry
 */
export const ENTITY_CONFIG: Record<EntityTypeId, EntityConfig> = {
  contact: {
    name: "contact",
    plural: "contacts",
    hasChildren: false,
  },
  categoryConfig: {
    name: "category configuration",
    plural: "category configurations",
    childExamples: ["categories"],
    hasChildren: true,
  },
  category: {
    name: "category",
    plural: "categories",
    hasChildren: false,
  },
};

/**
 * Get entity configuration by type
 */
export function getEntityConfig(
  entityType: EntityTypeId
): EntityConfig | undefined {
  return ENTITY_CONFIG[entityType];
}

/**
 * Build a delete confirmation message for an entity
 */
export function buildDeleteMessage(
  entityType: EntityTypeId,
  entityName?: string
): { title: string; description: string } {
  const config = ENTITY_CONFIG[entityType];

  if (!config) {
    return {
      title: entityName ? `Delete "${entityName}"?` : "Delete this item?",
      description: "This action cannot be undone.",
    };
  }

  const title = entityName
    ? `Delete "${entityName}"?`
    : `Delete this ${config.name}?`;

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
