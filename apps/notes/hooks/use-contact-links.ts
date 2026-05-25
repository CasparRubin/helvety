"use client";

import {
  guardE2eeMasterKey,
  reportE2eeActionFailure,
  reportE2eeHookError,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getContacts,
  getItemContactLinks,
  linkContact,
  unlinkContact,
} from "@/app/actions/contact-link-actions";
import { useEncryptionContext, decryptContactRows } from "@/lib/crypto";

import type { Contact } from "@/lib/types";

/**
 * A linked contact with its link metadata (link ID for unlinking).
 */
export interface LinkedContact extends Contact {
  /** The `entity_links` row ID (used for unlinking) */
  link_id: string;
  /** When the link was created */
  linked_at: string;
}

/** Raw note-contact link row derived from `entity_links`. */
interface ItemContactLinkRow {
  id: string;
  note_id: string;
  contact_id: string;
  user_id: string;
  created_at: string;
}

/** Return type of the useContactLinks hook. */
interface UseContactLinksReturn {
  /** All user contacts (decrypted), for the picker */
  allContacts: Contact[];
  /** Contacts linked to this note (decrypted, with link metadata) */
  linkedContacts: LinkedContact[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** User-visible error when the last contact-links operation failed */
  error: string | null;
  /** Refresh all data from server */
  refresh: () => Promise<void>;
  /** Link a contact to this note */
  link: (contactId: string) => Promise<boolean>;
  /** Unlink a contact from this note */
  unlink: (linkId: string) => Promise<boolean>;
}

/**
 * Hook to manage contact links for a specific note.
 * Fetches all user contacts and the note's links, decrypts client-side,
 * and provides link/unlink operations.
 */
export function useContactLinks(itemId: string): UseContactLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [links, setLinks] = useState<ItemContactLinkRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const latestRefreshRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Fetch and decrypt all contacts + fetch note links
   */
  const refresh = useCallback(async () => {
    if (!itemId) {
      setAllContacts([]);
      setLinks([]);
      setIsLoading(false);
      return;
    }
    if (!masterKey || !isUnlocked) {
      guardE2eeMasterKey(masterKey, isUnlocked, "notes-use-contact-links");
      setAllContacts([]);
      setLinks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const requestId = ++latestRefreshRequestRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();

    try {
      // Fetch contacts and links in parallel
      const [contactsResult, linksResult] = await Promise.all([
        getContacts(),
        getItemContactLinks(itemId),
      ]);

      if (!contactsResult.success) {
        if (
          !mountedRef.current ||
          requestId !== latestRefreshRequestRef.current
        ) {
          return;
        }
        if (
          reportE2eeActionFailure(contactsResult.error, {
            source: "notes-use-contact-links",
            fallback: "Failed to load contacts",
            setError,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        return;
      }

      if (!linksResult.success) {
        if (
          !mountedRef.current ||
          requestId !== latestRefreshRequestRef.current
        ) {
          return;
        }
        if (
          reportE2eeActionFailure(linksResult.error, {
            source: "notes-use-contact-links",
            fallback: "Failed to load linked contacts",
            setError,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        return;
      }

      // Decrypt contacts client-side
      const decrypted = await decryptContactRows(
        contactsResult.data,
        masterKey
      );
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      setAllContacts(decrypted);
      setLinks(linksResult.data);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      reportE2eeHookError(err, {
        source: "notes-use-contact-links",
        fallback: "Failed to load contact data",
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
      setAllContacts([]);
      setLinks([]);
    } finally {
      if (mountedRef.current && requestId === latestRefreshRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [masterKey, isUnlocked, itemId]);

  /**
   * Link a contact to this note
   */
  const link = useCallback(
    async (contactId: string): Promise<boolean> => {
      try {
        const result = await linkContact(itemId, contactId, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "notes-use-contact-links",
            fallback: "Failed to link contact",
          });
          return false;
        }

        // Optimistically add the link to local state
        const newLink: ItemContactLinkRow = {
          id: result.data.id,
          note_id: itemId,
          contact_id: contactId,
          user_id: "", // Not needed for display
          created_at: new Date().toISOString(),
        };
        setLinks((prev) => [...prev, newLink]);

        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "notes-use-contact-links",
          fallback: "Failed to link contact",
        });
        return false;
      }
    },
    [itemId, csrfToken]
  );

  /**
   * Unlink a contact from this note
   */
  const unlink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        const result = await unlinkContact(linkId, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "notes-use-contact-links",
            fallback: "Failed to unlink contact",
          });
          return false;
        }

        // Optimistically remove the link from local state
        setLinks((prev) => prev.filter((l) => l.id !== linkId));

        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "notes-use-contact-links",
          fallback: "Failed to unlink contact",
        });
        return false;
      }
    },
    [csrfToken]
  );

  // Fetch data when encryption is unlocked
  useEffect(() => {
    if (isUnlocked && masterKey && itemId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, itemId, refresh]);

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
