"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { handleAuthErrorNavigation } from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
  /** The `note_contact_links` row ID (used for unlinking) */
  link_id: string;
  /** When the link was created */
  linked_at: string;
}

/** Raw link row from `note_contact_links`. */
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
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh all data from server */
  refresh: () => Promise<void>;
  /** Link a contact to this note */
  link: (contactId: string) => Promise<boolean>;
  /** Unlink a contact from this note */
  unlink: (linkId: string) => Promise<boolean>;
}

/** Routes auth/E2EE failures to login or hard-logout via shared navigation. */
function triggerHardLogoutForError(
  rawError?: string | null,
  options?: {
    redirectUri?: string;
    expectedRoute?: string;
    requestStartedAt?: number;
  }
): boolean {
  return handleAuthErrorNavigation(
    rawError,
    options?.redirectUri ?? window.location.href,
    "notes-use-contact-links",
    {
      expectedRoute: options?.expectedRoute,
      requestStartedAt: options?.requestStartedAt,
    }
  );
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
    if (!masterKey || !isUnlocked || !itemId) {
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
          triggerHardLogoutForError(contactsResult.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = contactsResult.error ?? "Failed to fetch contacts";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
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
          triggerHardLogoutForError(linksResult.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = linksResult.error ?? "Failed to fetch linked contacts";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
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
      const msg =
        err instanceof Error ? err.message : "Failed to fetch contact data";
      if (
        triggerHardLogoutForError(msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to link contact", {
            duration: TOAST_DURATIONS.ERROR,
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
        const message =
          err instanceof Error ? err.message : "Failed to link contact";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
