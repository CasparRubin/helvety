"use server";
/* eslint-disable jsdoc/require-jsdoc */

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";
import { z } from "zod";

import type { ActionResponse } from "@/lib/types";

interface NoteContactLinkRow {
  id: string;
  note_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

interface LinkedNoteRow {
  id: string;
  encrypted_title: string;
  link_id: string;
  linked_at: string;
}

interface NoteLinkData {
  notes: LinkedNoteRow[];
}

interface NoteEntitiesData {
  notes: { id: string; encrypted_title: string }[];
}

export async function getContactNoteLinks(
  contactId: string
): Promise<ActionResponse<NoteLinkData>> {
  try {
    if (!z.string().uuid().safeParse(contactId).success) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (contactError || !contact) {
      return { success: false, error: "Contact not found" };
    }

    const { data: links, error: linksError } = await supabase
      .from("note_contact_links")
      .select("*")
      .eq("contact_id", contactId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<NoteContactLinkRow[]>();

    if (linksError) {
      logger.error("Error getting note links:", linksError);
      return { success: false, error: "Failed to get note links" };
    }

    if (!links || links.length === 0) {
      return { success: true, data: { notes: [] } };
    }

    const noteIds = links.map((link) => link.note_id);
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, encrypted_title")
      .in("id", noteIds)
      .eq("user_id", user.id)
      .returns<{ id: string; encrypted_title: string }[]>();

    if (notesError) {
      logger.error("Error fetching linked notes:", notesError);
      return { success: false, error: "Failed to fetch linked notes" };
    }

    const linkMap = new Map(
      links.map((link) => [
        link.note_id,
        { link_id: link.id, linked_at: link.created_at },
      ])
    );

    return {
      success: true,
      data: {
        notes: (notes ?? [])
          .map((note) => {
            const link = linkMap.get(note.id);
            if (!link) return null;
            return {
              id: note.id,
              encrypted_title: note.encrypted_title,
              link_id: link.link_id,
              linked_at: link.linked_at,
            };
          })
          .filter((note): note is NonNullable<typeof note> => note !== null),
      },
    };
  } catch (error) {
    logger.error("Unexpected error in getContactNoteLinks:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getNoteEntities(): Promise<
  ActionResponse<NoteEntitiesData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: notes, error } = await supabase
      .from("notes")
      .select("id, encrypted_title")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .returns<{ id: string; encrypted_title: string }[]>();

    if (error) {
      logger.error("Error fetching notes:", error);
      return { success: false, error: "Failed to fetch notes" };
    }

    return { success: true, data: { notes: notes ?? [] } };
  } catch (error) {
    logger.error("Unexpected error in getNoteEntities:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function linkNoteEntity(
  noteId: string,
  contactId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!z.string().uuid().safeParse(noteId).success) {
      return { success: false, error: "Invalid note ID" };
    }
    if (!z.string().uuid().safeParse(contactId).success) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [contact, note] = await Promise.all([
      supabase
        .from("contacts")
        .select("id")
        .eq("id", contactId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("notes")
        .select("id")
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (contact.error || !contact.data) {
      return { success: false, error: "Contact not found" };
    }
    if (note.error || !note.data) {
      return { success: false, error: "Note not found" };
    }

    const { data: link, error } = await supabase
      .from("note_contact_links")
      .insert({
        note_id: noteId,
        contact_id: contactId,
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
    logger.error("Unexpected error in linkNoteEntity:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unlinkNoteEntity(
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
      .from("note_contact_links")
      .delete()
      .eq("id", linkId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error unlinking note:", error);
      return { success: false, error: "Failed to unlink note" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Unexpected error in unlinkNoteEntity:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
