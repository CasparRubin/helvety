/**
 * Entity configuration registry for the Contacts app (@helvety/contacts)
 * Centralizes entity metadata for dynamic UI components (e.g., delete confirmations)
 */

import { defineEntityDeleteRegistry } from "@helvety/shared/entity-delete-message";

/** Entity type identifiers */
export type EntityTypeId = "contact";

const { buildDeleteMessage } = defineEntityDeleteRegistry<EntityTypeId>({
  contact: {
    name: "contact",
    plural: "contacts",
    hasChildren: false,
  },
});

export { buildDeleteMessage };
