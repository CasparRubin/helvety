"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import {
  patchEntityInList,
  patchSingleEntity,
} from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import {
  triggerE2eeHookAuthErrorNavigation,
  triggerHardLogoutOnce,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { reorderEntities } from "@/app/actions/entity-actions";
import { createItem, deleteItem, updateItem } from "@/app/actions/item-actions";
import {
  decryptItemRow,
  decryptItemRows,
  encryptItemInput,
  encryptItemUpdate,
  useEncryptionContext,
} from "@/lib/crypto";

import type {
  ActionResponse,
  Item,
  ItemInput,
  ItemRow,
  ReorderUpdate,
} from "@/lib/types";

const TASKS_BASE_PATH = "/tasks";

/** Builds a tasks API route using the app base path. */
export function getTasksApiPath(path: string): string {
  return `${TASKS_BASE_PATH}${path}`;
}

/** Options for useItems hook */
interface UseItemsOptions {
  /** Server-prefetched encrypted rows. Skips the initial fetch when provided. */
  initialEncryptedData?: ItemRow[];
}

/** Return type of the useItems hook. */
interface UseItemsReturn {
  /** List of decrypted items */
  items: Item[];
  /** Whether items are being loaded */
  isLoading: boolean;
  /** Whether items are currently being refreshed with stale data still visible */
  isRefreshing: boolean;
  /** User-visible error when the last tasks operation failed */
  error: string | null;
  /** Refresh items from server */
  refresh: () => Promise<void>;
  /** Create a new item */
  create: (input: ItemInput) => Promise<{ id: string } | null>;
  /** Update an item */
  update: (id: string, input: Partial<ItemInput>) => Promise<boolean>;
  /** Delete an item */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder items (for drag-and-drop) */
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Apply a local optimistic patch without a server request */
  patchLocal: (id: string, input: Partial<ItemInput>) => void;
}

/** Fetches encrypted task rows via GET route handler. */
async function fetchItems(): Promise<ActionResponse<ItemRow[]>> {
  const response = await fetch(getTasksApiPath("/api/items"), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ItemRow[]>(response, "Failed to load tasks");
}

/** Fetches a single encrypted task row via GET route handler. */
async function fetchItemById(id: string): Promise<ActionResponse<ItemRow>> {
  const response = await fetch(getTasksApiPath(`/api/items/${id}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ItemRow>(response, "Failed to load task");
}

/**
 * Hook to manage items with automatic encryption/decryption.
 */
export function useItems(options?: UseItemsOptions): UseItemsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setItems([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const perfLabel = `tasks:list-refresh:${refreshToken}`;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    performance.mark(`${perfLabel}:start`);
    const hasExistingItems = items.length > 0;
    if (hasExistingItems) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetchItems();
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = result.error ?? "Failed to load tasks";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        if (!hasExistingItems) {
          setItems([]);
        }
        return;
      }

      const decrypted = await decryptItemRows(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setItems(decrypted);
      performance.mark(`${perfLabel}:end`);
      performance.measure(
        "tasks:list-refresh-duration",
        `${perfLabel}:start`,
        `${perfLabel}:end`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks";
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      if (
        triggerE2eeHookAuthErrorNavigation("tasks-use-items", msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      if (!hasExistingItems) {
        setItems([]);
      }
    } finally {
      performance.clearMarks(`${perfLabel}:start`);
      performance.clearMarks(`${perfLabel}:end`);
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [items.length, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: ItemInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-items");
        return null;
      }

      try {
        const encrypted = await encryptItemInput(input, masterKey);
        const result = await createItem(encrypted, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error)
          ) {
            return null;
          }
          toast.error(result.error ?? "Failed to create task", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return null;
        }

        // Optimistic update: add the new item to local state
        setItems((prev) => {
          const maxSortOrder =
            prev.length > 0 ? Math.max(...prev.map((i) => i.sort_order)) : -1;
          const newItem: Item = {
            id: result.data.id,
            user_id: prev[0]?.user_id ?? "",
            title: input.title,
            description: input.description,
            start_date: input.start_date ?? null,
            end_date: input.end_date ?? null,
            stage_id: input.stage_id ?? null,
            label_id: input.label_id ?? null,
            priority: input.priority ?? 1,
            sort_order: maxSortOrder + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...prev, newItem].toSorted(
            (a, b) => a.sort_order - b.sort_order
          );
        });

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create task";
        if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", message)) {
          return null;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  const update = useCallback(
    async (id: string, input: Partial<ItemInput>): Promise<boolean> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-items");
        return false;
      }

      try {
        const encrypted = await encryptItemUpdate(id, input, masterKey);
        const result = await updateItem(
          {
            id,
            ...encrypted,
            ...(input.stage_id !== undefined && { stage_id: input.stage_id }),
            ...(input.label_id !== undefined && { label_id: input.label_id }),
            ...(input.priority !== undefined && { priority: input.priority }),
          },
          csrfToken
        );
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error)
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to update task", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setItems((prev) => patchEntityInList(prev, id, input));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update task";
        if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [masterKey, csrfToken]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic delete: remove from state immediately, rollback on failure
      let prevItems: Item[] = [];
      setItems((prev) => {
        prevItems = prev;
        return prev.filter((item) => item.id !== id);
      });

      try {
        const result = await deleteItem(id, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error)
          ) {
            return false;
          }
          setItems(prevItems);
          toast.error(result.error ?? "Failed to delete task", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete task";
        if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", message)) {
          return false;
        }
        setItems(prevItems);
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken]
  );

  const patchLocal = useCallback((id: string, input: Partial<ItemInput>) => {
    setItems((prev) => patchEntityInList(prev, id, input));
  }, []);

  /**
   * Batch reorder items (for drag-and-drop)
   */
  const reorder = useCallback(
    async (updates: ReorderUpdate[]): Promise<boolean> => {
      // Optimistic update
      setItems((prev) => {
        const updatesById = new Map(updates.map((u) => [u.id, u]));
        const updated = prev.map((item) => {
          const match = updatesById.get(item.id);
          if (!match) return item;
          return {
            ...item,
            sort_order: match.sort_order,
            stage_id:
              match.stage_id !== undefined ? match.stage_id : item.stage_id,
          };
        });
        return updated.toSorted((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderEntities("item", updates, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error)
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to reorder tasks", {
            duration: TOAST_DURATIONS.ERROR,
          });
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reorder tasks";
        if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh]
  );

  useEffect(() => {
    if (!isUnlocked || !masterKey) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptItemRows(options.initialEncryptedData, masterKey)
        .then((decrypted) => setItems(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt items";
          if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", msg)) {
            return;
          }
          setError(msg);
          toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        })
        .finally(() => setIsLoading(false));
      return;
    }

    void refresh();
  }, [
    isUnlocked,
    masterKey,
    refresh,
    options?.initialEncryptedData,
    initialDataConsumed,
  ]);

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
    patchLocal,
  };
}

/** Return type of the useItem hook for a single item. */
interface UseItemReturn {
  /** The decrypted item */
  item: Item | null;
  /** Whether the item is being loaded */
  isLoading: boolean;
  /** User-visible error when the last tasks operation failed */
  error: string | null;
  /** Refresh the item from server */
  refresh: () => Promise<void>;
  /** Update the item */
  update: (input: Partial<ItemInput>) => Promise<boolean>;
  /** Delete the item */
  remove: () => Promise<boolean>;
}

/** Options for useItem hook. */
interface UseItemOptions {
  /** Server-prefetched encrypted row. Skips the initial fetch when provided. */
  initialEncryptedData?: ItemRow;
  /** Already decrypted row. Skips fetch/decrypt when provided. */
  initialData?: Item;
}

/**
 * Hook to manage a single Item by ID
 */
export function useItem(id: string, options?: UseItemOptions): UseItemReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setItem(null);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchItemById(id);
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = result.error ?? "Failed to load task";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setItem(null);
        return;
      }

      const decrypted = await decryptItemRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setItem(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load task";
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      if (
        triggerE2eeHookAuthErrorNavigation("tasks-use-items", msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setItem(null);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<ItemInput>): Promise<boolean> => {
      if (!masterKey || !id) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-items");
        return false;
      }

      try {
        const encrypted = await encryptItemUpdate(id, input, masterKey);
        const result = await updateItem(
          {
            id,
            ...encrypted,
            ...(input.stage_id !== undefined && { stage_id: input.stage_id }),
            ...(input.label_id !== undefined && { label_id: input.label_id }),
            ...(input.priority !== undefined && { priority: input.priority }),
          },
          csrfToken
        );
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error)
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to update task", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setItem((prev) => patchSingleEntity(prev, input));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update task";
        if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [id, masterKey, csrfToken]
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) {
      toast.error("Task ID is missing", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return false;
    }

    try {
      const result = await deleteItem(id, csrfToken);
      if (!result.success) {
        if (
          triggerE2eeHookAuthErrorNavigation("tasks-use-items", result.error)
        ) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete task", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }

      setItem(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete task";
      if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", message)) {
        return false;
      }
      toast.error(message, { duration: TOAST_DURATIONS.ERROR });
      return false;
    }
  }, [id, csrfToken]);

  useEffect(() => {
    if (!isUnlocked || !masterKey || !id) return;

    if (options?.initialData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      setItem(options.initialData);
      setIsLoading(false);
      return;
    }

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptItemRow(options.initialEncryptedData, masterKey)
        .then((decrypted) => setItem(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt item";
          if (triggerE2eeHookAuthErrorNavigation("tasks-use-items", msg)) {
            return;
          }
          setError(msg);
          toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        })
        .finally(() => setIsLoading(false));
      return;
    }

    void refresh();
  }, [
    isUnlocked,
    masterKey,
    id,
    refresh,
    options?.initialData,
    options?.initialEncryptedData,
    initialDataConsumed,
  ]);

  return {
    item,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
