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
import { isUuidString } from "@helvety/shared/uuid-string";

import type { ActionResponse } from "@/lib/types";

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
    if (!isUuidString(contactId)) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const contactExists = await ensureOwnedEntityExists(
      supabase,
      user.id,
      "contacts",
      contactId
    );

    if (!contactExists) {
      return { success: false, error: "Contact not found" };
    }

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "contacts",
      entityId: contactId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError("Error getting note links", linksResult.error);
      return { success: false, error: "Failed to get note links" };
    }

    const links = toLinkedEntityReferences(
      linksResult.data ?? [],
      "contacts",
      contactId,
      "notes"
    );

    if (!links || links.length === 0) {
      return { success: true, data: { notes: [] } };
    }

    const noteIds = links.map((link) => link.entity_id);
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, encrypted_title")
      .in("id", noteIds)
      .eq("user_id", user.id)
      .returns<{ id: string; encrypted_title: string }[]>();

    if (notesError) {
      logger.logUnexpectedError("Error fetching linked notes", notesError);
      return { success: false, error: "Failed to fetch linked notes" };
    }

    const linkMap = new Map(
      links.map((link) => [
        link.entity_id,
        { link_id: link.link_id, linked_at: link.linked_at },
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
    logger.logUnexpectedError("Unexpected error in getContactNoteLinks", error);
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
      logger.logUnexpectedError("Error fetching notes", error);
      return { success: false, error: "Failed to fetch notes" };
    }

    return { success: true, data: { notes: notes ?? [] } };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in getNoteEntities", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function linkNoteEntity(
  noteId: string,
  contactId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(noteId)) {
      return { success: false, error: "Invalid note ID" };
    }
    if (!isUuidString(contactId)) {
      return { success: false, error: "Invalid contact ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "note-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const [contactExists, noteExists] = await Promise.all([
      ensureOwnedEntityExists(supabase, user.id, "contacts", contactId),
      ensureOwnedEntityExists(supabase, user.id, "notes", noteId),
    ]);

    if (!contactExists) {
      return { success: false, error: "Contact not found" };
    }
    if (!noteExists) {
      return { success: false, error: "Note not found" };
    }

    const linkResult = await createEntityLink({
      supabase,
      userId: user.id,
      sourceEntityType: "notes",
      sourceEntityId: noteId,
      targetEntityType: "contacts",
      targetEntityId: contactId,
    });

    if (linkResult.error || !linkResult.data) {
      if (linkResult.error?.code === "23505") {
        return { success: false, error: "Note is already linked" };
      }
      logger.logUnexpectedError("Error linking note", linkResult.error);
      return { success: false, error: "Failed to link note" };
    }

    return { success: true, data: { id: linkResult.data.id } };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in linkNoteEntity", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unlinkNoteEntity(
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

    const deleteResult = await deleteEntityLink(supabase, user.id, linkId);

    if (deleteResult.error) {
      logger.logUnexpectedError("Error unlinking note", deleteResult.error);
      return { success: false, error: "Failed to unlink note" };
    }

    return { success: true };
  } catch (error) {
    logger.logUnexpectedError("Unexpected error in unlinkNoteEntity", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
