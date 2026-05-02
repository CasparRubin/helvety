"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { triggerE2eeHookAuthErrorNavigation } from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getContactNoteLinks,
  getNoteEntities,
  linkNoteEntity,
  unlinkNoteEntity,
} from "@/app/actions/note-link-actions";
import {
  useEncryptionContext,
  buildAAD,
  decrypt,
  parseEncryptedData,
} from "@/lib/crypto";

export interface LinkedNote {
  id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

export interface PickerNote {
  id: string;
  title: string;
}

interface NoteLinkData {
  notes: {
    id: string;
    encrypted_title: string;
    link_id: string;
    linked_at: string;
  }[];
}

interface NoteEntitiesData {
  notes: { id: string; encrypted_title: string }[];
}

interface AllEntities {
  notes: PickerNote[];
}

interface UseNoteLinksReturn {
  notes: LinkedNote[];
  totalCount: number;
  allEntities: AllEntities;
  isLoading: boolean;
  isLoadingEntities: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadEntities: () => Promise<void>;
  link: (noteId: string) => Promise<boolean>;
  unlink: (linkId: string) => Promise<boolean>;
}

async function decryptNoteTitle(
  encryptedTitle: string,
  noteId: string,
  key: CryptoKey
): Promise<string> {
  try {
    const parsed = parseEncryptedData(encryptedTitle);
    return await decrypt(parsed, key, buildAAD("notes", noteId));
  } catch {
    return "(encrypted)";
  }
}

async function decryptNoteLinkData(
  data: NoteLinkData,
  key: CryptoKey
): Promise<LinkedNote[]> {
  return Promise.all(
    data.notes.map(async (note) => ({
      id: note.id,
      title: await decryptNoteTitle(note.encrypted_title, note.id, key),
      link_id: note.link_id,
      linked_at: note.linked_at,
    }))
  );
}

async function decryptEntitiesData(
  data: NoteEntitiesData,
  key: CryptoKey
): Promise<AllEntities> {
  return {
    notes: await Promise.all(
      data.notes.map(async (note) => ({
        id: note.id,
        title: await decryptNoteTitle(note.encrypted_title, note.id, key),
      }))
    ),
  };
}

const EMPTY_ENTITIES: AllEntities = { notes: [] };

export function useNoteLinks(contactId: string): UseNoteLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [notes, setNotes] = useState<LinkedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allEntities, setAllEntities] = useState<AllEntities>(EMPTY_ENTITIES);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const entitiesCacheRef = useRef<AllEntities | null>(null);
  const mountedRef = useRef(true);
  const latestRefreshRequestRef = useRef(0);
  const latestEntitiesRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !contactId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++latestRefreshRequestRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getContactNoteLinks(contactId);
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      if (!result.success) {
        if (
          triggerE2eeHookAuthErrorNavigation(
            "contacts-use-note-links",
            result.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        const msg = result.error ?? "Failed to load note links";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setNotes([]);
        return;
      }

      const decrypted = await decryptNoteLinkData(result.data, masterKey);
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      setNotes(decrypted);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      const msg =
        err instanceof Error ? err.message : "Failed to load note links";
      if (
        triggerE2eeHookAuthErrorNavigation("contacts-use-note-links", msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setNotes([]);
    } finally {
      if (mountedRef.current && requestId === latestRefreshRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [contactId, masterKey, isUnlocked]);

  const loadEntities = useCallback(async () => {
    if (entitiesCacheRef.current) {
      setAllEntities(entitiesCacheRef.current);
      return;
    }
    if (!masterKey || !isUnlocked) return;

    const requestId = ++latestEntitiesRequestRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoadingEntities(true);

    try {
      const result = await getNoteEntities();
      if (
        !mountedRef.current ||
        requestId !== latestEntitiesRequestRef.current
      ) {
        return;
      }
      if (!result.success) {
        if (
          triggerE2eeHookAuthErrorNavigation(
            "contacts-use-note-links",
            result.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        toast.error(result.error ?? "Failed to load notes", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return;
      }

      const decrypted = await decryptEntitiesData(result.data, masterKey);
      if (
        !mountedRef.current ||
        requestId !== latestEntitiesRequestRef.current
      ) {
        return;
      }
      entitiesCacheRef.current = decrypted;
      setAllEntities(decrypted);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== latestEntitiesRequestRef.current
      ) {
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to load notes";
      if (
        triggerE2eeHookAuthErrorNavigation("contacts-use-note-links", message, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      toast.error(message, { duration: TOAST_DURATIONS.ERROR });
    } finally {
      if (
        mountedRef.current &&
        requestId === latestEntitiesRequestRef.current
      ) {
        setIsLoadingEntities(false);
      }
    }
  }, [masterKey, isUnlocked]);

  const link = useCallback(
    async (noteId: string): Promise<boolean> => {
      try {
        const result = await linkNoteEntity(noteId, contactId, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-note-links",
              result.error
            )
          )
            return false;
          toast.error(result.error ?? "Failed to link note", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }
        await refresh();
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link note";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-note-links", message)
        )
          return false;
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [contactId, csrfToken, refresh]
  );

  const unlink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        const result = await unlinkNoteEntity(linkId, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-note-links",
              result.error
            )
          )
            return false;
          toast.error(result.error ?? "Failed to unlink note", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }
        setNotes((prev) => prev.filter((note) => note.link_id !== linkId));
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to unlink note";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-note-links", message)
        )
          return false;
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken]
  );

  useEffect(() => {
    if (isUnlocked && masterKey && contactId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, contactId, refresh]);

  return {
    notes,
    totalCount: notes.length,
    allEntities,
    isLoading,
    isLoadingEntities,
    error,
    refresh,
    loadEntities,
    link,
    unlink,
  };
}
