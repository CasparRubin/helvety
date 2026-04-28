import "server-only";

import {
  createEntityLink,
  deleteEntityLink,
  ensureOwnedEntityExists,
} from "./entity-links";

import type { LinkEntityType } from "./entity-links";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensure all entities in a link operation exist for the current user.
 */
export async function validateOwnedLinkEntities(
  supabase: SupabaseClient,
  userId: string,
  checks: Array<{
    entityType: LinkEntityType;
    entityId: string;
    notFoundMessage: string;
  }>
): Promise<{ success: true } | { success: false; error: string }> {
  const existenceResults = await Promise.all(
    checks.map((check) =>
      ensureOwnedEntityExists(
        supabase,
        userId,
        check.entityType,
        check.entityId
      )
    )
  );

  for (const [index, exists] of existenceResults.entries()) {
    if (!exists) {
      const check = checks[index];
      if (!check) {
        return { success: false, error: "Referenced entity not found" };
      }
      return { success: false, error: check.notFoundMessage };
    }
  }

  return { success: true };
}

/**
 * Create a canonical link row with duplicate handling.
 */
export async function createCanonicalLink({
  supabase,
  userId,
  sourceEntityType,
  sourceEntityId,
  targetEntityType,
  targetEntityId,
  duplicateMessage,
  failureMessage,
}: {
  supabase: SupabaseClient;
  userId: string;
  sourceEntityType: LinkEntityType;
  sourceEntityId: string;
  targetEntityType: LinkEntityType;
  targetEntityId: string;
  duplicateMessage: string;
  failureMessage: string;
}): Promise<
  | { success: true; id: string }
  | { success: false; error: string; logError?: unknown }
> {
  const linkResult = await createEntityLink({
    supabase,
    userId,
    sourceEntityType,
    sourceEntityId,
    targetEntityType,
    targetEntityId,
  });

  if (linkResult.error || !linkResult.data) {
    if (linkResult.error?.code === "23505") {
      return { success: false, error: duplicateMessage };
    }
    return {
      success: false,
      error: failureMessage,
      logError: linkResult.error,
    };
  }

  return { success: true, id: linkResult.data.id };
}

/**
 * Delete a link row by ID for the current user.
 */
export async function deleteCanonicalLink(
  supabase: SupabaseClient,
  userId: string,
  linkId: string,
  failureMessage: string
): Promise<
  { success: true } | { success: false; error: string; logError?: unknown }
> {
  const deleteResult = await deleteEntityLink(supabase, userId, linkId);
  if (deleteResult.error) {
    return {
      success: false,
      error: failureMessage,
      logError: deleteResult.error,
    };
  }

  return { success: true };
}
