"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { patchSingleEntity } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import {
  reportE2eeActionFailure,
  reportE2eeHookError,
  triggerHardLogoutOnce,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";
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
  items: Item[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: ItemInput) => Promise<{ id: string } | null>;
  update: (id: string, input: Partial<ItemInput>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
  patchLocal: (id: string, input: Partial<ItemInput>) => void;
}

/** Fetches encrypted task rows via GET route handler. */
function fetchItems(): Promise<Response> {
  return fetch(getTasksApiPath("/api/items"), {
    method: "GET",
    cache: "no-store",
  });
}

/** Fetches a single encrypted task row via GET route handler. */
async function fetchItemById(id: string): Promise<ActionResponse<ItemRow>> {
  const response = await fetch(getTasksApiPath(`/api/items/${id}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ItemRow>(response, "Failed to load task");
}

/** Hook to manage items with automatic encryption/decryption. */
export function useItems(options?: UseItemsOptions): UseItemsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  return useEncryptedSortableItems<Item, ItemRow, ItemInput, ReorderUpdate>({
    navigationSource: "tasks-use-items",
    perfMeasureName: "tasks:list-refresh-duration",
    initialEncryptedData: options?.initialEncryptedData,
    masterKey,
    isUnlocked,
    loadFailureMessage: "Failed to load tasks",
    createFailureMessage: "Failed to create task",
    updateFailureMessage: "Failed to update task",
    deleteFailureMessage: "Failed to delete task",
    reorderFailureMessage: "Failed to reorder tasks",
    decryptFailureMessage: "Failed to decrypt items",
    fetchRows: fetchItems,
    createItem: (payload, csrfToken) =>
      createItem(payload as Parameters<typeof createItem>[0], csrfToken),
    updateItem: (payload, csrfToken) =>
      updateItem(payload as Parameters<typeof updateItem>[0], csrfToken),
    deleteItem,
    reorderEntities: (_table, updates, csrfToken) =>
      reorderEntities("item", updates, csrfToken),
    encryptInput: encryptItemInput,
    encryptUpdate: encryptItemUpdate,
    decryptRows: decryptItemRows,
    buildCreatePayload: (encrypted) => encrypted,
    buildUpdatePayload: (id, encrypted, input) => ({
      id,
      ...(encrypted as object),
      ...(input.stage_id !== undefined && { stage_id: input.stage_id }),
      ...(input.label_id !== undefined && { label_id: input.label_id }),
      ...(input.priority !== undefined && { priority: input.priority }),
    }),
    buildOptimisticItem: (input, prev, created) => {
      const maxSortOrder =
        prev.length > 0 ? Math.max(...prev.map((i) => i.sort_order)) : -1;
      return {
        id: created.id,
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
    },
    applyReorderOptimistic: (prev, updates) => {
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
    },
  });
}

/** Return type of the useItem hook for a single item. */
interface UseItemReturn {
  item: Item | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (input: Partial<ItemInput>) => Promise<boolean>;
  remove: () => Promise<boolean>;
}

/** Options for useItem hook. */
interface UseItemOptions {
  initialEncryptedData?: ItemRow;
  initialData?: Item;
}

/** Hook to manage a single Item by ID */
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
          reportE2eeActionFailure(result.error, {
            source: "tasks-use-items",
            fallback: "Failed to load task",
            setError,
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setItem(null);
        return;
      }

      const decrypted = await decryptItemRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setItem(decrypted);
    } catch (err) {
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      reportE2eeHookError(err, {
        source: "tasks-use-items",
        fallback: "Failed to load task",
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
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
          reportE2eeActionFailure(result.error, {
            source: "tasks-use-items",
            fallback: "Failed to update task",
          });
          return false;
        }

        setItem((prev) => patchSingleEntity(prev, input));
        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "tasks-use-items",
          fallback: "Failed to update task",
        });
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
        reportE2eeActionFailure(result.error, {
          source: "tasks-use-items",
          fallback: "Failed to delete task",
        });
        return false;
      }

      setItem(null);
      return true;
    } catch (err) {
      reportE2eeHookError(err, {
        source: "tasks-use-items",
        fallback: "Failed to delete task",
      });
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
          reportE2eeHookError(err, {
            source: "tasks-use-items",
            fallback: "Failed to decrypt item",
            setError,
          });
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
