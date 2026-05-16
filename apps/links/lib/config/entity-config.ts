import {
  buildEntityDeleteMessage,
  type EntityDeleteConfig,
} from "@helvety/shared/entity-delete-message";

/**
 *
 */
type EntityConfig = EntityDeleteConfig;

/**
 *
 */
export type EntityTypeId = "folder" | "link";

const ENTITY_CONFIG: Record<EntityTypeId, EntityConfig> = {
  folder: {
    name: "folder",
    plural: "folders",
    hasChildren: true,
  },
  link: {
    name: "link",
    plural: "links",
    hasChildren: false,
  },
};

/**
 *
 */
export function buildDeleteMessage(
  entityType: EntityTypeId,
  entityName?: string
): { title: string; description: string } {
  return buildEntityDeleteMessage(ENTITY_CONFIG, entityType, entityName);
}
