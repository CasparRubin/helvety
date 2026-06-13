"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
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

/**
 *
 */
interface LinkedLinkRow {
  id: string;
  encrypted_name: string;
  encrypted_url: string;
  link_id: string;
  linked_at: string;
}

/**
 *
 */
export interface NoteLinkEntityLinkData {
  links: LinkedLinkRow[];
}

/**
 *
 */
export interface LinkEntitiesData {
  links: { id: string; encrypted_name: string; encrypted_url: string }[];
}

/**
 *
 */
export async function getNoteLinkEntityLinks(
  noteId: string
): Promise<ActionResponse<NoteLinkEntityLinkData>> {
  try {
    if (!isUuidString(noteId)) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "link-entity-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const noteExists = await ensureOwnedEntityExists(
      supabase,
      user.id,
      "notes",
      noteId
    );
    if (!noteExists) {
      return { success: false, error: "Note not found" };
    }

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "notes",
      entityId: noteId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError(
        "Error getting bookmark links for note",
        linksResult.error
      );
      return { success: false, error: "Failed to load linked bookmarks" };
    }

    const references = toLinkedEntityReferences(
      linksResult.data ?? [],
      "notes",
      noteId,
      "links"
    );

    if (references.length === 0) {
      return { success: true, data: { links: [] } };
    }

    const linkIds = references.map((reference) => reference.entity_id);
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("links")
      .select("id, encrypted_name, encrypted_url")
      .in("id", linkIds)
      .eq("user_id", user.id)
      .overrideTypes<
        { id: string; encrypted_name: string; encrypted_url: string }[],
        { merge: false }
      >();

    if (bookmarksError) {
      logger.logUnexpectedError(
        "Error fetching linked bookmarks",
        bookmarksError
      );
      return { success: false, error: "Failed to load linked links" };
    }

    const linkMap = new Map(
      references.map((reference) => [
        reference.entity_id,
        { link_id: reference.link_id, linked_at: reference.linked_at },
      ])
    );

    return {
      success: true,
      data: {
        links: (bookmarks ?? [])
          .map((bookmark) => {
            const link = linkMap.get(bookmark.id);
            if (!link) return null;
            return {
              id: bookmark.id,
              encrypted_name: bookmark.encrypted_name,
              encrypted_url: bookmark.encrypted_url,
              link_id: link.link_id,
              linked_at: link.linked_at,
            };
          })
          .filter((bookmark): bookmark is LinkedLinkRow => bookmark !== null),
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getNoteLinkEntityLinks",
      error
    );
  }
}

/**
 *
 */
export async function getLinkEntities(): Promise<
  ActionResponse<LinkEntitiesData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "link-entity-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: links, error } = await supabase
      .from("links")
      .select("id, encrypted_name, encrypted_url")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS)
      .overrideTypes<
        { id: string; encrypted_name: string; encrypted_url: string }[],
        { merge: false }
      >();

    if (error) {
      logger.logUnexpectedError("Error fetching bookmarks", error);
      return { success: false, error: "Failed to load links" };
    }

    return { success: true, data: { links: links ?? [] } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in getLinkEntities", error);
  }
}

/**
 *
 */
export async function linkLinkEntity(
  linkId: string,
  noteId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }
    if (!isUuidString(noteId)) {
      return { success: false, error: "Invalid note ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "link-entity-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const ownedEntities = await validateOwnedLinkEntities(supabase, user.id, [
      {
        entityType: "links",
        entityId: linkId,
        notFoundMessage: "Link not found",
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
      targetEntityType: "links",
      targetEntityId: linkId,
      duplicateMessage: "Link is already linked to this note",
      failureMessage: "Failed to link bookmark",
    });

    if (!linkResult.success) {
      if (linkResult.logError) {
        logger.logUnexpectedError(
          "Error linking bookmark to note",
          linkResult.logError
        );
      }
      return { success: false, error: linkResult.error };
    }

    return { success: true, data: { id: linkResult.id } };
  } catch (error) {
    return unexpectedActionError("Unexpected error in linkLinkEntity", error);
  }
}

/**
 *
 */
export async function unlinkLinkEntity(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "link-entity-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteCanonicalLink(
      supabase,
      user.id,
      linkId,
      "Failed to unlink bookmark"
    );
    if (!deleteResult.success) {
      if (deleteResult.logError) {
        logger.logUnexpectedError(
          "Error unlinking bookmark",
          deleteResult.logError
        );
      }
      return { success: false, error: deleteResult.error };
    }

    return { success: true };
  } catch (error) {
    return unexpectedActionError("Unexpected error in unlinkLinkEntity", error);
  }
}
