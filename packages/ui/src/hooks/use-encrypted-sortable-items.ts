"use client";

import { patchEntityInList } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  reportE2eeActionFailure,
  reportE2eeHookError,
  triggerHardLogoutOnce,
} from "../auth-navigation";
import { useCSRFToken } from "../csrf-provider";

/** Minimal decrypted entity shape for sortable E2EE lists. */
export interface EncryptedSortableEntity {
  id: string;
  user_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Minimal reorder payload for drag-and-drop lists. */
export interface EncryptedSortableReorderUpdate {
  id: string;
  sort_order: number;
}

/** Create action response used by E2EE list hooks. */
export type EncryptedSortableCreateResponse =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

/** Mutation action response without a payload. */
export type EncryptedSortableMutationResponse =
  | { success: true }
  | { success: false; error: string };

/** Options for {@link useEncryptedSortableItems}. */
export interface UseEncryptedSortableItemsOptions<
  TItem extends EncryptedSortableEntity,
  TRow,
  TInput,
  TReorderUpdate extends EncryptedSortableReorderUpdate,
> {
  navigationSource: string;
  perfMeasureName: string;
  initialEncryptedData?: TRow[];
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  loadFailureMessage: string;
  createFailureMessage: string;
  updateFailureMessage: string;
  deleteFailureMessage: string;
  reorderFailureMessage: string;
  decryptFailureMessage: string;
  fetchRows: () => Promise<Response>;
  createItem: (
    payload: unknown,
    csrfToken: string
  ) => Promise<EncryptedSortableCreateResponse>;
  updateItem: (
    payload: unknown,
    csrfToken: string
  ) => Promise<EncryptedSortableMutationResponse>;
  deleteItem: (
    id: string,
    csrfToken: string
  ) => Promise<EncryptedSortableMutationResponse>;
  reorderEntities: (
    table: string,
    updates: TReorderUpdate[],
    csrfToken: string
  ) => Promise<EncryptedSortableMutationResponse>;
  encryptInput: (input: TInput, masterKey: CryptoKey) => Promise<unknown>;
  encryptUpdate: (
    id: string,
    input: Partial<TInput>,
    masterKey: CryptoKey
  ) => Promise<unknown>;
  decryptRows: (rows: TRow[], masterKey: CryptoKey) => Promise<TItem[]>;
  buildCreatePayload: (encrypted: unknown, input: TInput) => unknown;
  buildUpdatePayload: (
    id: string,
    encrypted: unknown,
    input: Partial<TInput>
  ) => unknown;
  buildOptimisticItem: (
    input: TInput,
    prev: TItem[],
    created: { id: string }
  ) => TItem;
  applyReorderOptimistic: (prev: TItem[], updates: TReorderUpdate[]) => TItem[];
}

/** Return type of {@link useEncryptedSortableItems}. */
export interface UseEncryptedSortableItemsReturn<
  TItem extends EncryptedSortableEntity,
  TInput,
  TReorderUpdate extends EncryptedSortableReorderUpdate,
> {
  items: TItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: TInput) => Promise<{ id: string } | null>;
  update: (id: string, input: Partial<TInput>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  reorder: (updates: TReorderUpdate[]) => Promise<boolean>;
  /**
   * In-memory list patch without a network round trip.
   * Dashboard sheet editors should use optimistic `update()` instead; this remains for edge tooling/tests.
   */
  patchLocal: (id: string, input: Partial<TInput>) => void;
}

/**
 * Shared list CRUD/reorder hook for E2EE apps (tasks, notes, contacts).
 * Apps inject crypto, server actions, and domain-specific optimistic builders.
 * `update()` patches the list optimistically before the network call and rolls back on failure.
 * When `initialEncryptedData` is provided (SSR prefetch), the hook decrypts once
 * and does not auto-refetch on effect re-runs (React Strict Mode safe).
 *
 * **Dashboard sheet editors:** pass this hook's `update` / `remove` / `refresh` into zone
 * editors (Links pattern). Do not pair sheet editors with {@link useEncryptedSingleItem}.
 */
export function useEncryptedSortableItems<
  TItem extends EncryptedSortableEntity,
  TRow,
  TInput,
  TReorderUpdate extends EncryptedSortableReorderUpdate,
>(
  options: UseEncryptedSortableItemsOptions<TItem, TRow, TInput, TReorderUpdate>
): UseEncryptedSortableItemsReturn<TItem, TInput, TReorderUpdate> {
  const csrfToken = useCSRFToken();
  const {
    navigationSource,
    perfMeasureName,
    initialEncryptedData,
    masterKey,
    isUnlocked,
    loadFailureMessage,
    createFailureMessage,
    updateFailureMessage,
    deleteFailureMessage,
    reorderFailureMessage,
    decryptFailureMessage,
    fetchRows,
    createItem,
    updateItem,
    deleteItem,
    reorderEntities,
    encryptInput,
    encryptUpdate,
    decryptRows,
    buildCreatePayload,
    buildUpdatePayload,
    buildOptimisticItem,
    applyReorderOptimistic,
  } = options;

  const [items, setItems] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialDataConsumedRef = useRef(false);
  const latestRefreshTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setItems([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const perfLabel = `${navigationSource}:list-refresh:${refreshToken}`;
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
      const response = await fetchRows();
      const result = await parseActionResponse<TRow[]>(
        response,
        loadFailureMessage
      );
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          reportE2eeActionFailure(result.error, {
            source: navigationSource,
            fallback: loadFailureMessage,
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
        if (!hasExistingItems) {
          setItems([]);
        }
        return;
      }

      const decrypted = await decryptRows(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setItems(decrypted);
      performance.mark(`${perfLabel}:end`);
      performance.measure(
        perfMeasureName,
        `${perfLabel}:start`,
        `${perfLabel}:end`
      );
    } catch (err) {
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      reportE2eeHookError(err, {
        source: navigationSource,
        fallback: loadFailureMessage,
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
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
  }, [
    items.length,
    masterKey,
    isUnlocked,
    navigationSource,
    perfMeasureName,
    loadFailureMessage,
    fetchRows,
    decryptRows,
  ]);

  const create = useCallback(
    async (input: TInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, navigationSource);
        return null;
      }

      try {
        const encrypted = await encryptInput(input, masterKey);
        const result = await createItem(
          buildCreatePayload(encrypted, input),
          csrfToken
        );
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: navigationSource,
            fallback: createFailureMessage,
          });
          return null;
        }

        setItems((prev) => {
          const newItem = buildOptimisticItem(input, prev, result.data);
          return [...prev, newItem].toSorted(
            (a, b) => a.sort_order - b.sort_order
          );
        });

        return result.data;
      } catch (err) {
        reportE2eeHookError(err, {
          source: navigationSource,
          fallback: createFailureMessage,
        });
        return null;
      }
    },
    [
      masterKey,
      csrfToken,
      navigationSource,
      createFailureMessage,
      encryptInput,
      createItem,
      buildCreatePayload,
      buildOptimisticItem,
    ]
  );

  const update = useCallback(
    async (id: string, input: Partial<TInput>): Promise<boolean> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, navigationSource);
        return false;
      }

      let prevItems: TItem[] = [];
      setItems((prev) => {
        prevItems = prev;
        return patchEntityInList(
          prev,
          id,
          input as Partial<Omit<TItem, "id" | "updated_at">>
        );
      });

      try {
        const encrypted = await encryptUpdate(id, input, masterKey);
        const result = await updateItem(
          buildUpdatePayload(id, encrypted, input),
          csrfToken
        );
        if (!result.success) {
          if (
            !reportE2eeActionFailure(result.error, {
              source: navigationSource,
              fallback: updateFailureMessage,
            })
          ) {
            setItems(prevItems);
          }
          return false;
        }

        return true;
      } catch (err) {
        if (
          !reportE2eeHookError(err, {
            source: navigationSource,
            fallback: updateFailureMessage,
          })
        ) {
          setItems(prevItems);
        }
        return false;
      }
    },
    [
      masterKey,
      csrfToken,
      navigationSource,
      updateFailureMessage,
      encryptUpdate,
      updateItem,
      buildUpdatePayload,
    ]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      let prevItems: TItem[] = [];
      setItems((prev) => {
        prevItems = prev;
        return prev.filter((item) => item.id !== id);
      });

      try {
        const result = await deleteItem(id, csrfToken);
        if (!result.success) {
          if (
            !reportE2eeActionFailure(result.error, {
              source: navigationSource,
              fallback: deleteFailureMessage,
            })
          ) {
            setItems(prevItems);
          }
          return false;
        }

        return true;
      } catch (err) {
        if (
          !reportE2eeHookError(err, {
            source: navigationSource,
            fallback: deleteFailureMessage,
          })
        ) {
          setItems(prevItems);
        }
        return false;
      }
    },
    [csrfToken, navigationSource, deleteFailureMessage, deleteItem]
  );

  const patchLocal = useCallback((id: string, input: Partial<TInput>) => {
    setItems((prev) =>
      patchEntityInList(
        prev,
        id,
        input as Partial<Omit<TItem, "id" | "updated_at">>
      )
    );
  }, []);

  const reorder = useCallback(
    async (updates: TReorderUpdate[]): Promise<boolean> => {
      setItems((prev) => applyReorderOptimistic(prev, updates));

      try {
        const result = await reorderEntities("item", updates, csrfToken);
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: navigationSource,
            fallback: reorderFailureMessage,
          });
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: navigationSource,
          fallback: reorderFailureMessage,
        });
        await refresh();
        return false;
      }
    },
    [
      csrfToken,
      refresh,
      navigationSource,
      reorderFailureMessage,
      reorderEntities,
      applyReorderOptimistic,
    ]
  );

  useEffect(() => {
    if (!isUnlocked || !masterKey) return;

    if (initialEncryptedData) {
      if (!initialDataConsumedRef.current) {
        initialDataConsumedRef.current = true;
        setIsLoading(true);
        setError(null);
        decryptRows(initialEncryptedData, masterKey)
          .then((decrypted) => setItems(decrypted))
          .catch((err) => {
            reportE2eeHookError(err, {
              source: navigationSource,
              fallback: decryptFailureMessage,
              setError,
            });
          })
          .finally(() => setIsLoading(false));
      }
      return;
    }

    void refresh();
  }, [
    isUnlocked,
    masterKey,
    refresh,
    initialEncryptedData,
    navigationSource,
    decryptFailureMessage,
    decryptRows,
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
