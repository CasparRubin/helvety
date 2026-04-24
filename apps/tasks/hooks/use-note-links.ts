"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { triggerE2eeHookAuthErrorNavigation } from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getNotes,
  getItemNoteLinks,
  linkNote,
  unlinkNote,
} from "@/app/actions/note-link-actions";
import {
  useEncryptionContext,
  buildAAD,
  decrypt,
  parseEncryptedData,
} from "@/lib/crypto";

interface Note {
  id: string;
  title: string;
}

/**
 * A linked note with its link metadata (link ID for unlinking).
 */
export interface LinkedNote extends Note {
  /** The `note_item_links` row ID (used for unlinking) */
  link_id: string;
  /** When the link was created */
  linked_at: string;
}

/** Raw link row from `note_item_links`. */
interface ItemNoteLinkRow {
  id: string;
  item_id: string;
  note_id: string;
  user_id: string;
  created_at: string;
}

/** Return type of the useNoteLinks hook. */
interface UseNoteLinksReturn {
  /** All user notes (decrypted), for the picker */
  allNotes: Note[];
  /** Notes linked to this item (decrypted, with link metadata) */
  linkedNotes: LinkedNote[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh all data from server */
  refresh: () => Promise<void>;
  /** Link a note to this item */
  link: (noteId: string) => Promise<boolean>;
  /** Unlink a note from this item */
  unlink: (linkId: string) => Promise<boolean>;
}

async function decryptNoteTitle(
  encryptedTitle: string,
  noteId: string,
  key: CryptoKey
): Promise<string> {
  try {
    return await decrypt(
      parseEncryptedData(encryptedTitle),
      key,
      buildAAD("notes", noteId)
    );
  } catch {
    return "(encrypted)";
  }
}

/**
 * Hook to manage note links for a specific item.
 * Fetches all user notes and the item's links, decrypts client-side,
 * and provides link/unlink operations.
 */
export function useNoteLinks(itemId: string): UseNoteLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<ItemNoteLinkRow[]>([]);
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
   * Fetch and decrypt all notes + fetch item links
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !itemId) {
      setAllNotes([]);
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
      // Fetch notes and links in parallel
      const [notesResult, linksResult] = await Promise.all([
        getNotes(),
        getItemNoteLinks(itemId),
      ]);

      if (!notesResult.success) {
        if (
          !mountedRef.current ||
          requestId !== latestRefreshRequestRef.current
        ) {
          return;
        }
        if (
          triggerE2eeHookAuthErrorNavigation(
            "tasks-use-note-links",
            notesResult.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        const msg = notesResult.error ?? "Failed to fetch notes";
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
          triggerE2eeHookAuthErrorNavigation(
            "tasks-use-note-links",
            linksResult.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        const msg = linksResult.error ?? "Failed to fetch linked notes";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        return;
      }

      // Decrypt notes client-side
      const decrypted = await Promise.all(
        notesResult.data.map(async (row) => ({
          id: row.id,
          title: await decryptNoteTitle(row.encrypted_title, row.id, masterKey),
        }))
      );
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      setAllNotes(decrypted);
      setLinks(linksResult.data);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to fetch note data";
      if (
        triggerE2eeHookAuthErrorNavigation("tasks-use-note-links", msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setAllNotes([]);
      setLinks([]);
    } finally {
      if (mountedRef.current && requestId === latestRefreshRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [masterKey, isUnlocked, itemId]);

  /**
   * Link a note to this item
   */
  const link = useCallback(
    async (noteId: string): Promise<boolean> => {
      try {
        const result = await linkNote(itemId, noteId, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "tasks-use-note-links",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to link note", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistically add the link to local state
        const newLink: ItemNoteLinkRow = {
          id: result.data.id,
          item_id: itemId,
          note_id: noteId,
          user_id: "", // Not needed for display
          created_at: new Date().toISOString(),
        };
        setLinks((prev) => [...prev, newLink]);

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link note";
        if (
          triggerE2eeHookAuthErrorNavigation("tasks-use-note-links", message)
        ) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [itemId, csrfToken]
  );

  /**
   * Unlink a note from this item
   */
  const unlink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        const result = await unlinkNote(linkId, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "tasks-use-note-links",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to unlink note", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistically remove the link from local state
        setLinks((prev) => prev.filter((l) => l.id !== linkId));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to unlink note";
        if (
          triggerE2eeHookAuthErrorNavigation("tasks-use-note-links", message)
        ) {
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

  // Derive linkedNotes by joining links with allNotes
  const notesById = useMemo(
    () => new Map(allNotes.map((note) => [note.id, note])),
    [allNotes]
  );
  const linkedNotes = useMemo<LinkedNote[]>(
    () =>
      links
        .map((linkRow) => {
          const note = notesById.get(linkRow.note_id);
          if (!note) return null;
          return {
            ...note,
            link_id: linkRow.id,
            linked_at: linkRow.created_at,
          };
        })
        .filter((note): note is LinkedNote => note !== null),
    [links, notesById]
  );

  return {
    allNotes,
    linkedNotes,
    isLoading,
    error,
    refresh,
    link,
    unlink,
  };
}
