"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  createCanonicalLink,
  deleteCanonicalLink,
  validateOwnedLinkEntities,
} from "@helvety/shared/entity-link-action-primitives";
import {
  ensureOwnedEntityExists,
  getEntityLinksForEndpoint,
  toLinkedEntityReferences,
} from "@helvety/shared/entity-links";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
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
      return { success: false, error: "Failed to load note links" };
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
      .overrideTypes<
        { id: string; encrypted_title: string }[],
        { merge: false }
      >();

    if (notesError) {
      logger.logUnexpectedError("Error fetching linked notes", notesError);
      return { success: false, error: "Failed to load linked notes" };
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
    return unexpectedActionError(
      "Unexpected error in getContactNoteLinks",
      error
    );
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
      .select(ENCRYPTED_PREFETCH_COLUMNS.notes)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS)
      .overrideTypes<
        { id: string; encrypted_title: string }[],
        { merge: false }
      >();

    if (error) {
      logger.logUnexpectedError("Error fetching notes", error);
      return { success: false, error: "Failed to load notes" };
    }

    return { success: true, data: { notes: notes ?? [] } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getNoteEntities", error);
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

    const ownedEntities = await validateOwnedLinkEntities(supabase, user.id, [
      {
        entityType: "contacts",
        entityId: contactId,
        notFoundMessage: "Contact not found",
      },
      {
        entityType: "notes",
        entityId: noteId,
        notFoundMessage: "Note not found",
      },
    ]);
    if (!ownedEntities.success) {
      return ownedEntities;
    }

    const linkResult = await createCanonicalLink({
      supabase,
      userId: user.id,
      sourceEntityType: "notes",
      sourceEntityId: noteId,
      targetEntityType: "contacts",
      targetEntityId: contactId,
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
    return unexpectedActionError("Unexpected error in linkNoteEntity", error);
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
    return unexpectedActionError("Unexpected error in unlinkNoteEntity", error);
  }
}
