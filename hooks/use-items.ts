"use client";

import { useState, useCallback, useEffect } from "react";

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
import { useCSRFToken } from "@/lib/csrf-client";

import type { Item, ItemInput, ReorderUpdate } from "@/lib/types";

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

/**
 * Hook to manage Items for a specific Space with automatic encryption/decryption
 */
export function useItems(spaceId: string): UseItemsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.error);
        setItems([]);
        return;
      }

      const decrypted = await decryptItemRows(result.data, masterKey);
      setItems(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch items");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: ItemInput): Promise<{ id: string } | null> => {
      if (!masterKey || !csrfToken) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        const encrypted = await encryptItemInput(input, masterKey);
        const result = await createItem(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create item");
        return null;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<ItemInput, "space_id">>
    ): Promise<boolean> => {
      if (!masterKey || !csrfToken) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptItemUpdate(input, masterKey);
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
          setError(result.error ?? "Failed to update item");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update item");
        return false;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      try {
        const result = await deleteItem(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete item");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
        return false;
      }
    },
    [csrfToken, refresh]
  );

  /**
   * Batch reorder items (for drag-and-drop)
   */
  const reorder = useCallback(
    async (updates: ReorderUpdate[]): Promise<boolean> => {
      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      // Optimistic update
      setItems((prev) => {
        const updated = prev.map((item) => {
          const match = updates.find((u) => u.id === item.id);
          if (!match) return item;
          return {
            ...item,
            sort_order: match.sort_order,
            stage_id:
              match.stage_id !== undefined ? match.stage_id : item.stage_id,
          };
        });
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderEntities("item", updates, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to reorder items");
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder items"
        );
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh]
  );

  useEffect(() => {
    if (isUnlocked && masterKey && spaceId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, spaceId, refresh]);

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

/**
 * Hook to manage a single Item by ID
 */
export function useItem(id: string): UseItemReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.error);
        setItem(null);
        return;
      }

      const decrypted = await decryptItemRow(result.data, masterKey);
      setItem(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch item");
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<Omit<ItemInput, "space_id">>): Promise<boolean> => {
      if (!masterKey || !csrfToken || !id) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptItemUpdate(input, masterKey);
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
          setError(result.error ?? "Failed to update item");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update item");
        return false;
      }
    },
    [id, masterKey, csrfToken, refresh]
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!csrfToken || !id) {
      setError("CSRF token not available");
      return false;
    }

    try {
      const result = await deleteItem(id, csrfToken);
      if (!result.success) {
        setError(result.error ?? "Failed to delete item");
        return false;
      }

      setItem(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
      return false;
    }
  }, [id, csrfToken]);

  useEffect(() => {
    if (isUnlocked && masterKey && id) {
      void refresh();
    }
  }, [isUnlocked, masterKey, id, refresh]);

  return {
    item,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
