import { defineEntityDeleteRegistry } from "@helvety/shared/entity-delete-message";

/** Entity type identifiers for Links delete messaging. */
export type EntityTypeId = "folder" | "link";

const { buildDeleteMessage } = defineEntityDeleteRegistry<EntityTypeId>({
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
});

export { buildDeleteMessage };
