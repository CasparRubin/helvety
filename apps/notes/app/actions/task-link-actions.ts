"use server";
/* eslint-disable jsdoc/require-jsdoc */

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { z } from "zod";

import type {
  ActionResponse,
  ItemContactLinkRow,
  TaskLinkData,
  TaskEntitiesData,
} from "@/lib/types";

export async function getNoteTaskLinks(
  noteId: string
): Promise<ActionResponse<TaskLinkData>> {
  try {
    if (!z.string().uuid().safeParse(noteId).success) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single();

    if (noteError || !note) {
      return { success: false, error: "Note not found" };
    }

    const { data: links, error: linksError } = await supabase
      .from("note_item_links")
      .select("*")
      .eq("note_id", noteId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<ItemContactLinkRow[]>();

    if (linksError) {
      logger.error("Error getting task links:", linksError);
      return { success: false, error: "Failed to get task links" };
    }

    if (!links || links.length === 0) {
      return { success: true, data: { items: [] } };
    }

    const itemIds = links.map((link) => link.item_id);
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id, encrypted_title")
      .in("id", itemIds)
      .eq("user_id", user.id)
      .returns<{ id: string; encrypted_title: string }[]>();

    if (itemsError) {
      logger.error("Error fetching linked items:", itemsError);
      return { success: false, error: "Failed to fetch linked items" };
    }

    const linkMap = new Map(
      links.map((link) => [
        link.item_id,
        { link_id: link.id, linked_at: link.created_at },
      ])
    );

    return {
      success: true,
      data: {
        items: (items ?? [])
          .map((item) => {
            const link = linkMap.get(item.id);
            if (!link) return null;
            return {
              id: item.id,
              encrypted_title: item.encrypted_title,
              link_id: link.link_id,
              linked_at: link.linked_at,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getNoteTaskLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getTaskEntities(): Promise<
  ActionResponse<TaskEntitiesData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: items, error } = await supabase
      .from("items")
      .select("id, encrypted_title")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .returns<{ id: string; encrypted_title: string }[]>();

    if (error) {
      logger.error("Error fetching items:", error);
      return { success: false, error: "Failed to fetch items" };
    }

    return { success: true, data: { items: items ?? [] } };
  } catch (error) {
    logger.error("Unexpected error in getTaskEntities:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function linkTaskEntity(
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
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [note, item] = await Promise.all([
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

    if (note.error || !note.data) {
      return { success: false, error: "Note not found" };
    }
    if (item.error || !item.data) {
      return { success: false, error: "Item not found" };
    }

    const { data: link, error } = await supabase
      .from("note_item_links")
      .insert({
        note_id: noteId,
        item_id: itemId,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !link) {
      if (error?.code === "23505") {
        return { success: false, error: "Item is already linked" };
      }
      logger.error("Error linking task item:", error);
      return { success: false, error: "Failed to link item" };
    }

    return { success: true, data: { id: link.id } };
  } catch (error) {
    logger.error("Unexpected error in linkTaskEntity:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unlinkTaskEntity(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!z.string().uuid().safeParse(linkId).success) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "task-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { error } = await supabase
      .from("note_item_links")
      .delete()
      .eq("id", linkId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error unlinking task item:", error);
      return { success: false, error: "Failed to unlink item" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkTaskEntity:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
