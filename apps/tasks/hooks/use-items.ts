"use client";

import { pickDefinedStructuralFields } from "@helvety/shared/e2ee-structural-payload";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";

import { reorderEntities } from "@/app/actions/entity-actions";
import { createItem, deleteItem, updateItem } from "@/app/actions/item-actions";
import {
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

const TASK_STRUCTURAL_KEYS = ["stage_id", "label_id", "priority"] as const;

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
    buildCreatePayload: (encrypted, input) => ({
      ...(encrypted as object),
      ...pickDefinedStructuralFields(input, TASK_STRUCTURAL_KEYS),
    }),
    buildUpdatePayload: (id, encrypted, input) => ({
      id,
      ...(encrypted as object),
      ...pickDefinedStructuralFields(input, TASK_STRUCTURAL_KEYS),
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
