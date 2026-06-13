import "server-only";

export {
  createEntityLink,
  deleteEntityLink,
  ensureOwnedEntityExists,
  ENTITY_LINK_COLUMNS,
  getEntityLinksForEndpoint,
  toLinkedEntityReferences,
  type EntityLinkRow,
  type LinkEntityType,
  type LinkedEntityReference,
} from "./entity-links-client";
