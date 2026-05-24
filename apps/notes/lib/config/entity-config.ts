/**
 * Entity configuration registry for the Notes app (@helvety/notes).
 * Notes currently exposes delete messaging for note items only.
 */

import { defineEntityDeleteRegistry } from "@helvety/shared/entity-delete-message";

/** Entity type identifiers used by Notes delete messaging. */
export type EntityTypeId = "item";

const { buildDeleteMessage } = defineEntityDeleteRegistry<EntityTypeId>({
  item: {
    name: "note",
    plural: "notes",
    hasChildren: false,
  },
});

export { buildDeleteMessage };
