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

/**
 *
 */
interface LinkedContactRow {
  id: string;
  encrypted_first_name: string;
  encrypted_last_name: string;
  encrypted_email: string | null;
  link_id: string;
  linked_at: string;
}

/**
 *
 */
interface ContactLinkData {
  contacts: LinkedContactRow[];
}

/**
 *
 */
interface ContactEntitiesData {
  contacts: {
    id: string;
    encrypted_first_name: string;
    encrypted_last_name: string;
    encrypted_email: string | null;
  }[];
}

/**
 *
 */
export async function getLinkContactLinks(
  linkId: string
): Promise<ActionResponse<ContactLinkData>> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const linkExists = await ensureOwnedEntityExists(
      supabase,
      user.id,
      "links",
      linkId
    );
    if (!linkExists) {
      return { success: false, error: "Link not found" };
    }

    const linksResult = await getEntityLinksForEndpoint({
      supabase,
      userId: user.id,
      entityType: "links",
      entityId: linkId,
    });

    if (linksResult.error) {
      logger.logUnexpectedError(
        "Error getting contact links",
        linksResult.error
      );
      return { success: false, error: "Failed to load contact links" };
    }

    const references = toLinkedEntityReferences(
      linksResult.data ?? [],
      "links",
      linkId,
      "contacts"
    );

    if (references.length === 0) {
      return { success: true, data: { contacts: [] } };
    }

    const contactIds = references.map((reference) => reference.entity_id);
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, encrypted_first_name, encrypted_last_name, encrypted_email")
      .in("id", contactIds)
      .eq("user_id", user.id)
      .overrideTypes<
        {
          id: string;
          encrypted_first_name: string;
          encrypted_last_name: string;
          encrypted_email: string | null;
        }[],
        { merge: false }
      >();

    if (contactsError) {
      logger.logUnexpectedError(
        "Error fetching linked contacts",
        contactsError
      );
      return { success: false, error: "Failed to load linked contacts" };
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
        contacts: (contacts ?? [])
          .map((contact) => {
            const link = linkMap.get(contact.id);
            if (!link) return null;
            return {
              id: contact.id,
              encrypted_first_name: contact.encrypted_first_name,
              encrypted_last_name: contact.encrypted_last_name,
              encrypted_email: contact.encrypted_email,
              link_id: link.link_id,
              linked_at: link.linked_at,
            };
          })
          .filter((contact): contact is LinkedContactRow => contact !== null),
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getLinkContactLinks",
      error
    );
  }
}

/**
 *
 */
export async function getContactEntities(): Promise<
  ActionResponse<ContactEntitiesData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select(ENCRYPTED_PREFETCH_COLUMNS.contacts)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(ACTION_LIMITS.MAX_DASHBOARD_ROWS)
      .overrideTypes<
        {
          id: string;
          encrypted_first_name: string;
          encrypted_last_name: string;
          encrypted_email: string | null;
        }[],
        { merge: false }
      >();

    if (error) {
      logger.logUnexpectedError("Error fetching contacts", error);
      return { success: false, error: "Failed to load contacts" };
    }

    return { success: true, data: { contacts: contacts ?? [] } };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getContactEntities",
      error
    );
  }
}

/**
 *
 */
export async function linkContactEntity(
  contactId: string,
  linkId: string,
  csrfToken: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (!isUuidString(contactId)) {
      return { success: false, error: "Invalid contact ID" };
    }
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contact-links",
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
        entityType: "links",
        entityId: linkId,
        notFoundMessage: "Link not found",
      },
    ]);
    if (!ownedEntities.success) {
      return ownedEntities;
    }

    const linkResult = await createCanonicalLink({
      supabase,
      userId: user.id,
      sourceEntityType: "links",
      sourceEntityId: linkId,
      targetEntityType: "contacts",
      targetEntityId: contactId,
      duplicateMessage: "Contact is already linked",
      failureMessage: "Failed to link contact",
    });

    if (!linkResult.success) {
      if (linkResult.logError) {
        logger.logUnexpectedError("Error linking contact", linkResult.logError);
      }
      return { success: false, error: linkResult.error };
    }

    return { success: true, data: { id: linkResult.id } };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in linkContactEntity",
      error
    );
  }
}

/**
 *
 */
export async function unlinkContactEntity(
  linkId: string,
  csrfToken: string
): Promise<ActionResponse> {
  try {
    if (!isUuidString(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "contact-links",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const deleteResult = await deleteCanonicalLink(
      supabase,
      user.id,
      linkId,
      "Failed to unlink contact"
    );
    if (!deleteResult.success) {
      if (deleteResult.logError) {
        logger.logUnexpectedError(
          "Error unlinking contact",
          deleteResult.logError
        );
      }
      return { success: false, error: deleteResult.error };
    }

    return { success: true };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in unlinkContactEntity",
      error
    );
  }
}
