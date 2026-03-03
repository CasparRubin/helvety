"use client";

import { shouldForceHardLogoutFromActionError } from "@helvety/shared/auth-errors";
import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { forceHardLogout } from "@helvety/ui/hard-logout";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  reorderEntities,
} from "@/app/actions/task-actions";
import {
  useEncryptionContext,
  encryptItemInput,
  encryptItemUpdate,
  decryptItemRows,
  decryptItemRow,
} from "@/lib/crypto";

import type { Item, ItemInput, ItemRow, ReorderUpdate } from "@/lib/types";

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
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh items from server */
  refresh: () => Promise<void>;
  /** Create a new item */
  create: (input: ItemInput) => Promise<{ id: string } | null>;
  /** Update an item */
  update: (
    id: string,
    input: Partial<Omit<ItemInput, "space_id">>
  ) => Promise<boolean>;
  /** Delete an item */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder items (for drag-and-drop) */
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
}

/** Force the centralized logout flow when auth/E2EE state is invalid. */
function triggerHardLogoutForError(rawError?: string | null): boolean {
  if (!shouldForceHardLogoutFromActionError(rawError)) {
    return false;
  }
  void forceHardLogout(window.location.href);
  return true;
}

/**
 * Hook to manage Items for a specific Space with automatic encryption/decryption
 */
export function useItems(
  spaceId: string,
  options?: UseItemsOptions
): UseItemsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !spaceId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getItems(spaceId);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return;
        }
        const msg = result.error ?? "Failed to fetch items";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setItems([]);
        return;
      }

      const decrypted = await decryptItemRows(result.data, masterKey);
      setItems(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch items";
      if (triggerHardLogoutForError(msg)) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: ItemInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        void forceHardLogout(window.location.href);
        return null;
      }

      try {
        const encrypted = await encryptItemInput(input, masterKey);
        const result = await createItem(encrypted, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return null;
          }
          toast.error(result.error ?? "Failed to create item", {
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
            space_id: input.space_id,
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
          err instanceof Error ? err.message : "Failed to create item";
        if (triggerHardLogoutForError(message)) {
          return null;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<ItemInput, "space_id">>
    ): Promise<boolean> => {
      if (!masterKey) {
        void forceHardLogout(window.location.href);
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update item", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              ...(input.title !== undefined && { title: input.title }),
              ...(input.description !== undefined && {
                description: input.description,
              }),
              ...(input.start_date !== undefined && {
                start_date: input.start_date ?? null,
              }),
              ...(input.end_date !== undefined && {
                end_date: input.end_date ?? null,
              }),
              ...(input.stage_id !== undefined && {
                stage_id: input.stage_id ?? null,
              }),
              ...(input.label_id !== undefined && {
                label_id: input.label_id ?? null,
              }),
              ...(input.priority !== undefined && { priority: input.priority }),
              updated_at: new Date().toISOString(),
            };
          })
        );

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update item";
        if (triggerHardLogoutForError(message)) {
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          setItems(prevItems);
          toast.error(result.error ?? "Failed to delete item", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete item";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        setItems(prevItems);
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken]
  );

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
        const result = await reorderEntities(
          "item",
          updates,
          csrfToken,
          spaceId
        );
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to reorder items", {
            duration: TOAST_DURATIONS.ERROR,
          });
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reorder items";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh, spaceId]
  );

  useEffect(() => {
    if (!isUnlocked || !masterKey || !spaceId) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptItemRows(options.initialEncryptedData, masterKey)
        .then((decrypted) => setItems(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt items";
          if (triggerHardLogoutForError(msg)) {
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
    spaceId,
    refresh,
    options?.initialEncryptedData,
    initialDataConsumed,
  ]);

  return {
    items,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}

/** Return type of the useItem hook for a single item. */
interface UseItemReturn {
  /** The decrypted item */
  item: Item | null;
  /** Whether the item is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh the item from server */
  refresh: () => Promise<void>;
  /** Update the item */
  update: (input: Partial<Omit<ItemInput, "space_id">>) => Promise<boolean>;
  /** Delete the item */
  remove: () => Promise<boolean>;
}

/** Options for useItem hook. */
interface UseItemOptions {
  /** Server-prefetched encrypted row. Skips the initial fetch when provided. */
  initialEncryptedData?: ItemRow;
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

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setItem(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getItem(id);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return;
        }
        const msg = result.error ?? "Failed to fetch item";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setItem(null);
        return;
      }

      const decrypted = await decryptItemRow(result.data, masterKey);
      setItem(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch item";
      if (triggerHardLogoutForError(msg)) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<Omit<ItemInput, "space_id">>): Promise<boolean> => {
      if (!masterKey || !id) {
        void forceHardLogout(window.location.href);
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update item", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setItem((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.start_date !== undefined && {
              start_date: input.start_date ?? null,
            }),
            ...(input.end_date !== undefined && {
              end_date: input.end_date ?? null,
            }),
            ...(input.stage_id !== undefined && {
              stage_id: input.stage_id ?? null,
            }),
            ...(input.label_id !== undefined && {
              label_id: input.label_id ?? null,
            }),
            ...(input.priority !== undefined && { priority: input.priority }),
            updated_at: new Date().toISOString(),
          };
        });

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update item";
        if (triggerHardLogoutForError(message)) {
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
      toast.error("Invalid or missing ID", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return false;
    }

    try {
      const result = await deleteItem(id, csrfToken);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete item", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }

      setItem(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete item";
      if (triggerHardLogoutForError(message)) {
        return false;
      }
      toast.error(message, { duration: TOAST_DURATIONS.ERROR });
      return false;
    }
  }, [id, csrfToken]);

  useEffect(() => {
    if (!isUnlocked || !masterKey || !id) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptItemRow(options.initialEncryptedData, masterKey)
        .then((decrypted) => setItem(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt item";
          if (triggerHardLogoutForError(msg)) {
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
