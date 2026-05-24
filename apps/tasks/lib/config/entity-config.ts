/**
 * Entity configuration registry for the Tasks app (@helvety/tasks)
 * Centralizes entity metadata for dynamic UI components (e.g., delete confirmations)
 *
 * When adding new entities:
 * 1. Add an entry here with name, plural, childExamples (if any), and hasChildren
 * 2. Update parent entity's childExamples if the new entity is a child
 */

import { defineEntityDeleteRegistry } from "@helvety/shared/entity-delete-message";

/** Entity type identifiers */
export type EntityTypeId = "item" | "stage" | "label";

const { buildDeleteMessage } = defineEntityDeleteRegistry<EntityTypeId>({
  item: {
    name: "task",
    plural: "tasks",
    hasChildren: false,
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
});

export { buildDeleteMessage };
