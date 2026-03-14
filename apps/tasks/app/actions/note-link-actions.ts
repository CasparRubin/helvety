"use server";
/* eslint-disable jsdoc/require-jsdoc */

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
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
 * Get all note links for a specific item.
 */
export async function getItemNoteLinks(
  itemId: string
): Promise<ActionResponse<NoteItemLinkRow[]>> {
  try {
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid item ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: links, error } = await supabase
      .from("note_item_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .order("created_at", { ascending: true })
      .returns<NoteItemLinkRow[]>();

    if (error) {
      logger.error("Error getting note links:", error);
      return { success: false, error: "Failed to get note links" };
    }

    return { success: true, data: links ?? [] };
  } catch (error) {
    logger.error("Unexpected error in getItemNoteLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Link a note to an item.
 */
export async function linkNote(
  itemId: string,
  noteId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!z.string().uuid().safeParse(itemId).success) {
      return { success: false, error: "Invalid item ID" };
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

    const [noteResult, itemResult] = await Promise.all([
      supabase
        .from("notes")
        .select("id")
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("items")
        .select("id")
        .eq("id", itemId)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (noteResult.error || !noteResult.data) {
      return { success: false, error: "Note not found" };
    }
    if (itemResult.error || !itemResult.data) {
      return { success: false, error: "Item not found" };
    }

    const { data: link, error } = await supabase
      .from("note_item_links")
      .insert({
        item_id: itemId,
        note_id: noteId,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !link) {
      if (error?.code === "23505") {
        return { success: false, error: "Note is already linked" };
      }
      logger.error("Error linking note:", error);
      return { success: false, error: "Failed to link note" };
    }

    return { success: true, data: { id: link.id } };
  } catch (error) {
    logger.error("Unexpected error in linkNote:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Unlink a note from an item by deleting the link row.
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

    const { error } = await supabase
      .from("note_item_links")
      .delete()
      .eq("id", linkId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error unlinking note:", error);
      return { success: false, error: "Failed to unlink note" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkNote:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
