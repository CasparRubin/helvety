"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect, useRef } from "react";

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

  // Track whether we've already loaded contacts to avoid re-fetching on every link change
  const contactsCacheRef = useRef<Contact[] | null>(null);

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
        setError(contactsResult.error);
        return;
      }

      if (!linksResult.success) {
        setError(linksResult.error);
        return;
      }

      // Decrypt contacts client-side
      const decrypted = await decryptContactRows(
        contactsResult.data,
        masterKey
      );
      setAllContacts(decrypted);
      contactsCacheRef.current = decrypted;
      setLinks(linksResult.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch contact data"
      );
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
          setError(result.error);
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
        setError(err instanceof Error ? err.message : "Failed to link contact");
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
          setError(result.error ?? "Failed to unlink contact");
          return false;
        }

        // Optimistically remove the link from local state
        setLinks((prev) => prev.filter((l) => l.id !== linkId));

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to unlink contact"
        );
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
  const contactsById = new Map(allContacts.map((c) => [c.id, c]));
  const linkedContacts: LinkedContact[] = links
    .map((linkRow) => {
      const contact = contactsById.get(linkRow.contact_id);
      if (!contact) return null;
      return {
        ...contact,
        link_id: linkRow.id,
        linked_at: linkRow.created_at,
      };
    })
    .filter((c): c is LinkedContact => c !== null);

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
