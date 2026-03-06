"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { handleAuthErrorNavigation } from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getContacts,
  getEntityContactLinks,
  linkContact,
  unlinkContact,
} from "@/app/actions/contact-link-actions";
import { useEncryptionContext, decryptContactRows } from "@/lib/crypto";

import type { Contact, EntityContactLinkRow, EntityType } from "@/lib/types";

/**
 * A linked contact with its link metadata (link ID for unlinking).
 */
export interface LinkedContact extends Contact {
  /** The entity_contact_links row ID (used for unlinking) */
  link_id: string;
  /** When the link was created */
  linked_at: string;
}

/** Return type of the useContactLinks hook. */
interface UseContactLinksReturn {
  /** All user contacts (decrypted), for the picker */
  allContacts: Contact[];
  /** Contacts linked to this entity (decrypted, with link metadata) */
  linkedContacts: LinkedContact[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh all data from server */
  refresh: () => Promise<void>;
  /** Link a contact to this entity */
  link: (contactId: string) => Promise<boolean>;
  /** Unlink a contact from this entity */
  unlink: (linkId: string) => Promise<boolean>;
}

/** Routes auth/E2EE failures to login or hard-logout via shared navigation. */
function triggerHardLogoutForError(rawError?: string | null): boolean {
  return handleAuthErrorNavigation(
    rawError,
    window.location.href,
    "tasks-use-contact-links"
  );
}

/**
 * Hook to manage contact links for a specific entity (unit, space, or item).
 * Fetches all user contacts and the entity's links, decrypts client-side,
 * and provides link/unlink operations.
 */
export function useContactLinks(
  entityType: EntityType,
  entityId: string
): UseContactLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [links, setLinks] = useState<EntityContactLinkRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and decrypt all contacts + fetch entity links
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !entityId) {
      setAllContacts([]);
      setLinks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch contacts and links in parallel
      const [contactsResult, linksResult] = await Promise.all([
        getContacts(),
        getEntityContactLinks(entityType, entityId),
      ]);

      if (!contactsResult.success) {
        if (triggerHardLogoutForError(contactsResult.error)) {
          return;
        }
        const msg = contactsResult.error ?? "Failed to fetch contacts";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        return;
      }

      if (!linksResult.success) {
        if (triggerHardLogoutForError(linksResult.error)) {
          return;
        }
        const msg = linksResult.error ?? "Failed to fetch links";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        return;
      }

      // Decrypt contacts client-side
      const decrypted = await decryptContactRows(
        contactsResult.data,
        masterKey
      );
      setAllContacts(decrypted);
      setLinks(linksResult.data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch contact data";
      if (triggerHardLogoutForError(msg)) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setAllContacts([]);
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked, entityType, entityId]);

  /**
   * Link a contact to this entity
   */
  const link = useCallback(
    async (contactId: string): Promise<boolean> => {
      try {
        const result = await linkContact(
          entityType,
          entityId,
          contactId,
          csrfToken
        );
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to link contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistically add the link to local state
        const newLink: EntityContactLinkRow = {
          id: result.data.id,
          entity_type: entityType,
          entity_id: entityId,
          contact_id: contactId,
          user_id: "", // Not needed for display
          created_at: new Date().toISOString(),
        };
        setLinks((prev) => [...prev, newLink]);

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link contact";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [entityType, entityId, csrfToken]
  );

  /**
   * Unlink a contact from this entity
   */
  const unlink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        const result = await unlinkContact(linkId, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to unlink contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistically remove the link from local state
        setLinks((prev) => prev.filter((l) => l.id !== linkId));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to unlink contact";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken]
  );

  // Fetch data when encryption is unlocked
  useEffect(() => {
    if (isUnlocked && masterKey && entityId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, entityId, refresh]);

  // Derive linkedContacts by joining links with allContacts
  const contactsById = useMemo(
    () => new Map(allContacts.map((c) => [c.id, c])),
    [allContacts]
  );
  const linkedContacts = useMemo<LinkedContact[]>(
    () =>
      links
        .map((linkRow) => {
          const contact = contactsById.get(linkRow.contact_id);
          if (!contact) return null;
          return {
            ...contact,
            link_id: linkRow.id,
            linked_at: linkRow.created_at,
          };
        })
        .filter((c): c is LinkedContact => c !== null),
    [links, contactsById]
  );

  return {
    allContacts,
    linkedContacts,
    isLoading,
    error,
    refresh,
    link,
    unlink,
  };
}
