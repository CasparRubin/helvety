"use client";

import { safeDecryptDisplayField } from "@helvety/shared/crypto";
import {
  reportE2eeActionFailure,
  reportE2eeHookError,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getContactNoteLinks,
  getNoteEntities,
  linkNoteEntity,
  unlinkNoteEntity,
} from "@/app/actions/note-link-actions";
import { useEncryptionContext } from "@/lib/crypto";

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
  return safeDecryptDisplayField({
    encrypted: encryptedTitle,
    recordId: noteId,
    key,
    aadTable: "notes",
  });
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
        reportE2eeActionFailure(result.error, {
          source: "contacts-use-note-links",
          fallback: "Failed to load note links",
          setError,
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        });
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
      reportE2eeHookError(err, {
        source: "contacts-use-note-links",
        fallback: "Failed to load note links",
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
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
        reportE2eeActionFailure(result.error, {
          source: "contacts-use-note-links",
          fallback: "Failed to load notes",
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
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
      reportE2eeHookError(err, {
        source: "contacts-use-note-links",
        fallback: "Failed to load notes",
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
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
          reportE2eeActionFailure(result.error, {
            source: "contacts-use-note-links",
            fallback: "Failed to link note",
          });
          return false;
        }
        await refresh();
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "contacts-use-note-links",
          fallback: "Failed to link note",
        });
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
          reportE2eeActionFailure(result.error, {
            source: "contacts-use-note-links",
            fallback: "Failed to unlink note",
          });
          return false;
        }
        setNotes((prev) => prev.filter((note) => note.link_id !== linkId));
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "contacts-use-note-links",
          fallback: "Failed to unlink note",
        });
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
