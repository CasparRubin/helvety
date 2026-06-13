import { isUuidString } from "./uuid-string";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Entity types that can be linked through `entity_links`. */
export type LinkEntityType = "notes" | "items" | "contacts" | "links";

/** Explicit column list for `entity_links` queries (no `select("*")`). */
export const ENTITY_LINK_COLUMNS =
  "id,user_id,source_entity_type,source_entity_id,target_entity_type,target_entity_id,relation_type,metadata,created_at" as const;

/** Row shape returned by the `entity_links` table. */
export interface EntityLinkRow {
  id: string;
  user_id: string;
  source_entity_type: LinkEntityType;
  source_entity_id: string;
  target_entity_type: LinkEntityType;
  target_entity_id: string;
  relation_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Canonical endpoint descriptor used for source/target normalization. */
interface LinkEndpoint {
  entityType: LinkEntityType;
  entityId: string;
}

/** Input required to create a normalized entity link. */
interface CreateEntityLinkInput {
  supabase: SupabaseClient;
  userId: string;
  sourceEntityType: LinkEntityType;
  sourceEntityId: string;
  targetEntityType: LinkEntityType;
  targetEntityId: string;
  relationType?: string;
}

/** Input required to query links for a single endpoint. */
interface GetEntityLinksInput {
  supabase: SupabaseClient;
  userId: string;
  entityType: LinkEntityType;
  entityId: string;
  relationType?: string;
}

/** Linked entity projection returned to app-level action handlers. */
export interface LinkedEntityReference {
  entity_id: string;
  link_id: string;
  linked_at: string;
}

const ENTITY_TABLE_BY_TYPE: Record<LinkEntityType, string> = {
  notes: "notes",
  items: "items",
  contacts: "contacts",
  links: "links",
};

/** Provides deterministic ordering for link endpoints. */
function compareEndpoints(a: LinkEndpoint, b: LinkEndpoint): number {
  if (a.entityType === b.entityType) {
    if (a.entityId === b.entityId) return 0;
    return a.entityId < b.entityId ? -1 : 1;
  }
  return a.entityType < b.entityType ? -1 : 1;
}

/** Converts two endpoints into a stable source/target pair. */
function toCanonicalPair(
  a: LinkEndpoint,
  b: LinkEndpoint
): {
  source: LinkEndpoint;
  target: LinkEndpoint;
} {
  return compareEndpoints(a, b) <= 0
    ? { source: a, target: b }
    : { source: b, target: a };
}

/** Validates that an entity exists and is owned by the authenticated user. */
export async function ensureOwnedEntityExists(
  supabase: SupabaseClient,
  userId: string,
  entityType: LinkEntityType,
  entityId: string
): Promise<boolean> {
  if (!isUuidString(entityId) || !isUuidString(userId)) {
    return false;
  }
  const tableName = ENTITY_TABLE_BY_TYPE[entityType];
  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  return !error && Boolean(data);
}

/** Creates a canonical link row and returns the inserted identifier metadata. */
export async function createEntityLink({
  supabase,
  userId,
  sourceEntityType,
  sourceEntityId,
  targetEntityType,
  targetEntityId,
  relationType = "related",
}: CreateEntityLinkInput): Promise<{
  data: Pick<EntityLinkRow, "id" | "created_at"> | null;
  error: { code?: string; message: string } | null;
}> {
  if (
    !isUuidString(userId) ||
    !isUuidString(sourceEntityId) ||
    !isUuidString(targetEntityId) ||
    !relationType.trim()
  ) {
    return {
      data: null,
      error: { message: "Invalid link input payload." },
    };
  }

  const canonical = toCanonicalPair(
    { entityType: sourceEntityType, entityId: sourceEntityId },
    { entityType: targetEntityType, entityId: targetEntityId }
  );

  const { data, error } = await supabase
    .from("entity_links")
    .insert({
      user_id: userId,
      source_entity_type: canonical.source.entityType,
      source_entity_id: canonical.source.entityId,
      target_entity_type: canonical.target.entityType,
      target_entity_id: canonical.target.entityId,
      relation_type: relationType,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return {
      data: null,
      error: { code: error.code, message: error.message },
    };
  }

  return { data, error: null };
}

/** Deletes one link row scoped to the authenticated user. */
export async function deleteEntityLink(
  supabase: SupabaseClient,
  userId: string,
  linkId: string
): Promise<{ error: { code?: string; message: string } | null }> {
  if (!isUuidString(userId) || !isUuidString(linkId)) {
    return { error: { message: "Invalid link delete payload." } };
  }

  const { error } = await supabase
    .from("entity_links")
    .delete()
    .eq("id", linkId)
    .eq("user_id", userId);

  if (error) {
    return { error: { code: error.code, message: error.message } };
  }

  return { error: null };
}

/** Returns all links connected to a given endpoint and optional relation type. */
export async function getEntityLinksForEndpoint({
  supabase,
  userId,
  entityType,
  entityId,
  relationType,
}: GetEntityLinksInput): Promise<{
  data: EntityLinkRow[] | null;
  error: { code?: string; message: string } | null;
}> {
  if (!isUuidString(userId) || !isUuidString(entityId)) {
    return {
      data: null,
      error: { message: "Invalid link query payload." },
    };
  }

  if (!(entityType in ENTITY_TABLE_BY_TYPE)) {
    return {
      data: null,
      error: { message: "Invalid entity type for link query." },
    };
  }

  let query = supabase
    .from("entity_links")
    .select(ENTITY_LINK_COLUMNS)
    .eq("user_id", userId)
    .or(
      `and(source_entity_type.eq.${entityType},source_entity_id.eq.${entityId}),and(target_entity_type.eq.${entityType},target_entity_id.eq.${entityId})`
    )
    .order("created_at", { ascending: true });

  if (relationType) {
    query = query.eq("relation_type", relationType);
  }

  const { data, error } = await query.overrideTypes<
    EntityLinkRow[],
    { merge: false }
  >();

  if (error) {
    return {
      data: null,
      error: { code: error.code, message: error.message },
    };
  }

  return { data: data ?? [], error: null };
}

/** Projects link rows into references for one linked entity type. */
export function toLinkedEntityReferences(
  links: EntityLinkRow[],
  endpointType: LinkEntityType,
  endpointId: string,
  linkedType: LinkEntityType
): LinkedEntityReference[] {
  return links
    .map((link) => {
      if (
        link.source_entity_type === endpointType &&
        link.source_entity_id === endpointId &&
        link.target_entity_type === linkedType
      ) {
        return {
          entity_id: link.target_entity_id,
          link_id: link.id,
          linked_at: link.created_at,
        };
      }

      if (
        link.target_entity_type === endpointType &&
        link.target_entity_id === endpointId &&
        link.source_entity_type === linkedType
      ) {
        return {
          entity_id: link.source_entity_id,
          link_id: link.id,
          linked_at: link.created_at,
        };
      }

      return null;
    })
    .filter(
      (reference): reference is LinkedEntityReference => reference !== null
    );
}
