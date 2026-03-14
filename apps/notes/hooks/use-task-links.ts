"use client";
/* eslint-disable jsdoc/require-jsdoc */

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { handleAuthErrorNavigation } from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getNoteTaskLinks,
  getTaskEntities,
  linkTaskEntity,
  unlinkTaskEntity,
} from "@/app/actions/task-link-actions";
import {
  useEncryptionContext,
  buildAAD,
  decrypt,
  parseEncryptedData,
} from "@/lib/crypto";

import type {
  LinkedItem,
  TaskLinkData,
  PickerItem,
  TaskEntitiesData,
} from "@/lib/types";

export interface AllEntities {
  items: PickerItem[];
}

export interface UseTaskLinksReturn {
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
    "notes-use-task-links",
    {
      expectedRoute: options?.expectedRoute,
      requestStartedAt: options?.requestStartedAt,
    }
  );
}

export async function decryptItemTitle(
  encryptedTitle: string,
  itemId: string,
  key: CryptoKey
): Promise<string> {
  try {
    const parsed = parseEncryptedData(encryptedTitle);
    return await decrypt(parsed, key, buildAAD("items", itemId));
  } catch {
    return "(encrypted)";
  }
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
        if (
          triggerHardLogoutForError(result.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = result.error ?? "Failed to fetch task links";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
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
      const msg =
        err instanceof Error ? err.message : "Failed to fetch task links";
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
        if (
          triggerHardLogoutForError(result.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        toast.error(result.error ?? "Failed to fetch items", {
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
        err instanceof Error ? err.message : "Failed to fetch items";
      if (
        triggerHardLogoutForError(message, {
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
    async (itemId: string): Promise<boolean> => {
      try {
        const result = await linkTaskEntity(itemId, noteId, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) return false;
          toast.error(result.error ?? "Failed to link item", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }
        await refresh();
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to link item";
        if (triggerHardLogoutForError(message)) return false;
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
          if (triggerHardLogoutForError(result.error)) return false;
          toast.error(result.error ?? "Failed to unlink item", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }
        setItems((prev) => prev.filter((item) => item.link_id !== linkId));
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to unlink item";
        if (triggerHardLogoutForError(message)) return false;
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
