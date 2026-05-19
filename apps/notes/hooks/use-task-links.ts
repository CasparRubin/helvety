"use client";

import { safeDecryptDisplayField } from "@helvety/shared/crypto";
import {
  reportE2eeActionFailure,
  reportE2eeHookError,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getNoteTaskLinks,
  getTaskEntities,
  linkTaskEntity,
  unlinkTaskEntity,
} from "@/app/actions/task-link-actions";
import { useEncryptionContext } from "@/lib/crypto";

import type {
  LinkedItem,
  TaskLinkData,
  PickerItem,
  TaskEntitiesData,
} from "@/lib/types";

interface AllEntities {
  items: PickerItem[];
}

interface UseTaskLinksReturn {
  items: LinkedItem[];
  totalCount: number;
  allEntities: AllEntities;
  isLoading: boolean;
  isLoadingEntities: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadEntities: () => Promise<void>;
  link: (itemId: string) => Promise<boolean>;
  unlink: (linkId: string) => Promise<boolean>;
}

async function decryptItemTitle(
  encryptedTitle: string,
  itemId: string,
  key: CryptoKey
): Promise<string> {
  return safeDecryptDisplayField({
    encrypted: encryptedTitle,
    recordId: itemId,
    key,
    aadTable: "items",
  });
}

async function decryptTaskLinkData(
  data: TaskLinkData,
  key: CryptoKey
): Promise<LinkedItem[]> {
  return Promise.all(
    data.items.map(async (item) => ({
      id: item.id,
      title: await decryptItemTitle(item.encrypted_title, item.id, key),
      link_id: item.link_id,
      linked_at: item.linked_at,
    }))
  );
}

async function decryptEntitiesData(
  data: TaskEntitiesData,
  key: CryptoKey
): Promise<AllEntities> {
  return {
    items: await Promise.all(
      data.items.map(async (item) => ({
        id: item.id,
        title: await decryptItemTitle(item.encrypted_title, item.id, key),
      }))
    ),
  };
}

const EMPTY_ENTITIES: AllEntities = { items: [] };

export function useTaskLinks(noteId: string): UseTaskLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [items, setItems] = useState<LinkedItem[]>([]);
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
    if (!masterKey || !isUnlocked || !noteId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const requestId = ++latestRefreshRequestRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getNoteTaskLinks(noteId);
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      if (!result.success) {
        reportE2eeActionFailure(result.error, {
          source: "notes-use-task-links",
          fallback: "Failed to load task links",
          setError,
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        });
        setItems([]);
        return;
      }

      const decrypted = await decryptTaskLinkData(result.data, masterKey);
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      setItems(decrypted);
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== latestRefreshRequestRef.current
      ) {
        return;
      }
      reportE2eeHookError(err, {
        source: "notes-use-task-links",
        fallback: "Failed to load task links",
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
      setItems([]);
    } finally {
      if (mountedRef.current && requestId === latestRefreshRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [noteId, masterKey, isUnlocked]);

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
      const result = await getTaskEntities();
      if (
        !mountedRef.current ||
        requestId !== latestEntitiesRequestRef.current
      ) {
        return;
      }
      if (!result.success) {
        reportE2eeActionFailure(result.error, {
          source: "notes-use-task-links",
          fallback: "Failed to load tasks",
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
        source: "notes-use-task-links",
        fallback: "Failed to load tasks",
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
    async (itemId: string): Promise<boolean> => {
      try {
        const result = await linkTaskEntity(itemId, noteId, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "notes-use-task-links",
            fallback: "Failed to link task",
          });
          return false;
        }
        await refresh();
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "notes-use-task-links",
          fallback: "Failed to link task",
        });
        return false;
      }
    },
    [noteId, csrfToken, refresh]
  );

  const unlink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        const result = await unlinkTaskEntity(linkId, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "notes-use-task-links",
            fallback: "Failed to unlink task",
          });
          return false;
        }
        setItems((prev) => prev.filter((item) => item.link_id !== linkId));
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "notes-use-task-links",
          fallback: "Failed to unlink task",
        });
        return false;
      }
    },
    [csrfToken]
  );

  useEffect(() => {
    if (isUnlocked && masterKey && noteId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, noteId, refresh]);

  return {
    items,
    totalCount: items.length,
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
