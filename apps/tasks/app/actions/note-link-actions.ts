"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  createCanonicalLink,
  deleteCanonicalLink,
  validateOwnedLinkEntities,
} from "@helvety/shared/entity-link-action-primitives";
import {
  getEntityLinksForEndpoint,
  toLinkedEntityReferences,
} from "@helvety/shared/entity-links";
import { logger } from "@helvety/shared/logger";
import { isUuidString } from "@helvety/shared/uuid-string";

import type { ActionResponse } from "@/lib/types";

interface NoteRow {
  id: string;
  encrypted_title: string;
  user_id: string;
  sort_order: number;
  created_at: string;
}

/** Raw link row from `note_item_links`. */
interface NoteItemLinkRow {
  id: string;
  note_id: string;
  item_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Get all Notes for the current user.
 * Returns encrypted data that must be decrypted client-side.
 */
export async function getNotes(): Promise<ActionResponse<NoteRow[]>> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .overrideTypes<NoteRow[], { merge: false }>();

    if (error) {
      logger.logUnexpectedError("Error getting notes", error);
      return { success: false, error: "Failed to get notes" };
    }

    return { success: true, data: notes ?? [] };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getNotes", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all note links for a specific task.
 */
export async function getItemNoteLinks(
  itemId: string
): Promise<ActionResponse<NoteItemLinkRow[]>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid task ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "items",
      entityId: itemId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError("Error getting note links", linksResult.error);
      return { success: false, error: "Failed to get note links" };
    }

    const references = toLinkedEntityReferences(
      linksResult.data ?? [],
      "items",
      itemId,
      "notes"
    );

    const rows: NoteItemLinkRow[] = references.map((reference) => ({
      id: reference.link_id,
      item_id: itemId,
      note_id: reference.entity_id,
      user_id: user.id,
      created_at: reference.linked_at,
    }));

    return { success: true, data: rows };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getItemNoteLinks", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link a note to a task.
 */
export async function linkNote(
  itemId: string,
  noteId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(itemId)) {
      return { success: false, error: "Invalid task ID" };
    }
    if (!isUuidString(noteId)) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const ownedEntities = await validateOwnedLinkEntities(supabase, user.id, [
      {
        entityType: "notes",
        entityId: noteId,
        notFoundMessage: "Note not found",
      },
      {
        entityType: "items",
        entityId: itemId,
        notFoundMessage: "Task not found",
      },
    ]);
    if (!ownedEntities.success) {
      return ownedEntities;
    }

    const linkResult = await createCanonicalLink({
      supabase,
      userId: user.id,
      sourceEntityType: "items",
      sourceEntityId: itemId,
      targetEntityType: "notes",
      targetEntityId: noteId,
      duplicateMessage: "Note is already linked",
      failureMessage: "Failed to link note",
    });

    if (!linkResult.success) {
      if (linkResult.logError) {
        logger.logUnexpectedError("Error linking note", linkResult.logError);
      }
      return { success: false, error: linkResult.error };
    }

    return { success: true, data: { id: linkResult.id } };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in linkNote", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Unlink a note from a task by deleting the link row.
 */
export async function unlinkNote(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteCanonicalLink(
      supabase,
      user.id,
      linkId,
      "Failed to unlink note"
    );
    if (!deleteResult.success) {
      if (deleteResult.logError) {
        logger.logUnexpectedError(
          "Error unlinking note",
          deleteResult.logError
        );
      }
      return { success: false, error: deleteResult.error };
    }

    return { success: true };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in unlinkNote", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
