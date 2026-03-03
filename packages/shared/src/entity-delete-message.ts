/** Shared entity metadata shape for delete confirmation copy. */
export interface EntityDeleteConfig {
  /** Display name (singular). */
  name: string;
  /** Display name (plural). */
  plural: string;
  /** Example child types for delete warning copy. */
  childExamples?: string[];
  /** Whether this entity can have nested content. */
  hasChildren: boolean;
}

/** Builds a delete dialog title/description from entity metadata. */
export function buildEntityDeleteMessage<EntityTypeId extends string>(
  configMap: Record<EntityTypeId, EntityDeleteConfig>,
  entityType: EntityTypeId,
  entityName?: string
): { title: string; description: string } {
  const config = configMap[entityType];

  if (!config) {
    return {
      title: entityName ? `Delete "${entityName}"?` : "Delete this item?",
      description: "This action is permanent and cannot be undone.",
    };
  }

  const title = entityName
    ? `Delete "${entityName}"?`
    : `Delete this ${config.name}?`;

  if (config.hasChildren) {
    const childList = config.childExamples?.length
      ? config.childExamples.join(", ")
      : "nested content";
    return {
      title,
      description: `This will permanently delete this ${config.name} and all its contents, including ${childList} and any other nested data. This action is permanent and cannot be undone.`,
    };
  }

  return {
    title,
    description: `This will permanently delete this ${config.name}. This action is permanent and cannot be undone.`,
  };
}
