"use client";

import { patchSingleEntity } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import { useEncryptedSingleItem } from "@helvety/ui/hooks/use-encrypted-single-item";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";

import { reorderEntities } from "@/app/actions/entity-actions";
import { createItem, deleteItem, updateItem } from "@/app/actions/item-actions";
import { DEFAULT_NOTE_CATEGORY_ID } from "@/lib/config/default-note-categories";
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

const NOTES_BASE_PATH = "/notes";

/** Builds a notes API route using the app base path. */
export function getNotesApiPath(path: string): string {
  return `${NOTES_BASE_PATH}${path}`;
}

/** Options for useItems hook */
interface UseItemsOptions {
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

/** Fetches encrypted note rows via GET route handler. */
function fetchItems(): Promise<Response> {
  return fetch(getNotesApiPath("/api/items"), {
    method: "GET",
    cache: "no-store",
  });
}

/** Fetches a single encrypted note row via GET route handler. */
export async function fetchNoteById(
  id: string
): Promise<ActionResponse<ItemRow>> {
  const response = await fetch(getNotesApiPath(`/api/items/${id}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ItemRow>(response, "Failed to load note");
}

/** Hook to manage the note list with automatic encryption/decryption. */
export function useItems(options?: UseItemsOptions): UseItemsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  return useEncryptedSortableItems<Item, ItemRow, ItemInput, ReorderUpdate>({
    navigationSource: "notes-use-items",
    perfMeasureName: "notes:list-refresh-duration",
    initialEncryptedData: options?.initialEncryptedData,
    masterKey,
    isUnlocked,
    loadFailureMessage: "Failed to load notes",
    createFailureMessage: "Failed to create note",
    updateFailureMessage: "Failed to update note",
    deleteFailureMessage: "Failed to delete note",
    reorderFailureMessage: "Failed to reorder notes",
    decryptFailureMessage: "Failed to decrypt notes",
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
      ...(input.category_id !== undefined
        ? { category_id: input.category_id }
        : {}),
    }),
    buildUpdatePayload: (id, encrypted, input) => ({
      id,
      ...(encrypted as object),
      ...(input.category_id !== undefined
        ? { category_id: input.category_id }
        : {}),
    }),
    buildOptimisticItem: (input, prev, created) => {
      const maxSortOrder =
        prev.length > 0 ? Math.max(...prev.map((i) => i.sort_order)) : -1;
      return {
        id: created.id,
        user_id: prev[0]?.user_id ?? "",
        title: input.title,
        description: input.description,
        category_id: input.category_id ?? DEFAULT_NOTE_CATEGORY_ID,
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
          ...(match.category_id !== undefined && {
            category_id: match.category_id,
          }),
        };
      });
      return updated.toSorted((a, b) => a.sort_order - b.sort_order);
    },
  });
}

/** Return type of the useItem hook for a single note. */
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

/** Hook to fetch/update one note by id (optional; not used by the dashboard sheet editor). */
export function useItem(id: string, options?: UseItemOptions): UseItemReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  return useEncryptedSingleItem<
    Item,
    ItemRow,
    ItemInput,
    Parameters<typeof updateItem>[0]
  >({
    id,
    navigationSource: "notes-use-items",
    masterKey,
    isUnlocked,
    loadFailureMessage: "Failed to load note",
    updateFailureMessage: "Failed to update note",
    deleteFailureMessage: "Failed to delete note",
    decryptFailureMessage: "Failed to decrypt note",
    deleteMissingIdMessage:
      "We couldn't identify this note. Please refresh and try again.",
    initialEncryptedData: options?.initialEncryptedData,
    initialData: options?.initialData,
    fetchById: fetchNoteById,
    decryptRow: decryptItemRow,
    encryptUpdate: encryptItemUpdate,
    buildUpdatePayload: (entityId, encrypted, input) => ({
      id: entityId,
      ...encrypted,
      ...(input.category_id !== undefined
        ? { category_id: input.category_id }
        : {}),
    }),
    updateEntity: updateItem,
    deleteEntity: deleteItem,
    patchEntity: patchSingleEntity,
  });
}
