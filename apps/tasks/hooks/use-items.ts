"use client";

import { patchSingleEntity } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import { useEncryptedSingleItem } from "@helvety/ui/hooks/use-encrypted-single-item";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";

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
  createWithId: (
    id: string,
    input: ItemInput
  ) => Promise<{ id: string } | null>;
  seedDraft: (id: string, input: ItemInput) => void;
  removeDraft: (id: string) => void;
  update: (id: string, input: Partial<ItemInput>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** In-memory list patch without network I/O; prefer `update()` for dashboard saves. */
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
export async function fetchTaskById(
  id: string
): Promise<ActionResponse<ItemRow>> {
  const response = await fetch(getTasksApiPath(`/api/items/${id}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ItemRow>(response, "Failed to load task");
}

/** Hook to manage the task list with automatic encryption/decryption. */
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

/** Hook to fetch/update one task by id (optional; not used by the dashboard sheet editor). */
export function useItem(id: string, options?: UseItemOptions): UseItemReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  return useEncryptedSingleItem<
    Item,
    ItemRow,
    ItemInput,
    Parameters<typeof updateItem>[0]
  >({
    id,
    navigationSource: "tasks-use-items",
    masterKey,
    isUnlocked,
    loadFailureMessage: "Failed to load task",
    updateFailureMessage: "Failed to update task",
    deleteFailureMessage: "Failed to delete task",
    decryptFailureMessage: "Failed to decrypt item",
    deleteMissingIdMessage: "Task ID is missing",
    initialEncryptedData: options?.initialEncryptedData,
    initialData: options?.initialData,
    fetchById: fetchTaskById,
    decryptRow: decryptItemRow,
    encryptUpdate: encryptItemUpdate,
    buildUpdatePayload: (entityId, encrypted, input) => ({
      id: entityId,
      ...encrypted,
      ...(input.stage_id !== undefined && { stage_id: input.stage_id }),
      ...(input.label_id !== undefined && { label_id: input.label_id }),
      ...(input.priority !== undefined && { priority: input.priority }),
    }),
    updateEntity: updateItem,
    deleteEntity: deleteItem,
    patchEntity: patchSingleEntity,
  });
}
