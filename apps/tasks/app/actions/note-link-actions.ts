"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import {
  createEntityLink,
  deleteEntityLink,
  ensureOwnedEntityExists,
  getEntityLinksForEndpoint,
  toLinkedEntityReferences,
} from "@helvety/shared/entity-links";
import { logger } from "@helvety/shared/logger";
import { z } from "zod";

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
      .returns<NoteRow[]>();

    if (error) {
      logger.error("Error getting notes:", error);
      return { success: false, error: "Failed to get notes" };
    }

    return { success: true, data: notes ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getNotes:", error);
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
    if (!z.string().uuid().safeParse(itemId).success) {
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
      logger.error("Error getting note links:", linksResult.error);
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
    logger.error("Unexpected error in getItemNoteLinks:", error);
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
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid task ID" };
    }
    if (!z.string().uuid().safeParse(noteId).success) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [noteExists, itemExists] = await Promise.all([
      ensureOwnedEntityExists(supabase, user.id, "notes", noteId),
      ensureOwnedEntityExists(supabase, user.id, "items", itemId),
    ]);

    if (!noteExists) {
      return { success: false, error: "Note not found" };
    }
    if (!itemExists) {
      return { success: false, error: "Task not found" };
    }

    const linkResult = await createEntityLink({
      supabase,
      userId: user.id,
      sourceEntityType: "items",
      sourceEntityId: itemId,
      targetEntityType: "notes",
      targetEntityId: noteId,
    });

    if (linkResult.error || !linkResult.data) {
      if (linkResult.error?.code === "23505") {
        return { success: false, error: "Note is already linked" };
      }
      logger.error("Error linking note:", linkResult.error);
      return { success: false, error: "Failed to link note" };
    }

    return { success: true, data: { id: linkResult.data.id } };
  } catch (error) {
    logger.error("Unexpected error in linkNote:", error);
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
    if (!z.string().uuid().safeParse(linkId).success) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteEntityLink(supabase, user.id, linkId);

    if (deleteResult.error) {
      logger.error("Error unlinking note:", deleteResult.error);
      return { success: false, error: "Failed to unlink note" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkNote:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
