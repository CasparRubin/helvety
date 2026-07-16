"use client";

import { pickDefinedStructuralFields } from "@helvety/shared/e2ee-structural-payload";
import { patchSingleEntity } from "@helvety/shared/optimistic-entity";
import { parseActionResponse } from "@helvety/shared/parse-action-response";
import { useEncryptedSingleItem } from "@helvety/ui/hooks/use-encrypted-single-item";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";

import {
  createContact,
  updateContact,
  deleteContact,
  reorderContacts,
} from "@/app/actions/contact-actions";
import { DEFAULT_CONTACT_CATEGORY_ID } from "@/lib/config/default-categories";
import {
  useEncryptionContext,
  encryptContactInput,
  encryptContactUpdate,
  decryptContactRows,
  decryptContactRow,
} from "@/lib/crypto";

import type {
  ActionResponse,
  Contact,
  ContactInput,
  ContactRow,
  ReorderUpdate,
} from "@/lib/types";

const CONTACTS_BASE_PATH = "/contacts";

const CONTACT_STRUCTURAL_KEYS = ["category_id"] as const;

/** Builds a contacts API route using the app base path. */
export function getContactsApiPath(path: string): string {
  return `${CONTACTS_BASE_PATH}${path}`;
}

/** Options for the useContacts hook. */
interface UseContactsOptions {
  /** Server-prefetched encrypted contacts. Skips the initial fetch when provided. */
  initialEncryptedData?: ContactRow[];
}

/** Return type of the useContacts hook. */
interface UseContactsReturn {
  /** List of decrypted contacts */
  contacts: Contact[];
  /** Whether contacts are being loaded */
  isLoading: boolean;
  /** Whether contacts are currently being refreshed with stale data still visible */
  isRefreshing: boolean;
  /** User-visible error when the last contacts operation failed */
  error: string | null;
  /** Refresh contacts from server */
  refresh: () => Promise<void>;
  /** Create a new contact */
  create: (input: ContactInput) => Promise<{ id: string } | null>;
  /** Update a contact */
  update: (id: string, input: Partial<ContactInput>) => Promise<boolean>;
  /** Delete a contact */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder contacts (for drag-and-drop) */
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** In-memory list patch without network I/O; prefer `update()` for dashboard saves. */
  patchLocal: (id: string, input: Partial<ContactInput>) => void;
}

/** Fetches encrypted contact rows via GET route handler. */
function fetchContacts(): Promise<Response> {
  return fetch(getContactsApiPath("/api/contacts"), {
    method: "GET",
    cache: "no-store",
  });
}

/** Fetches a single encrypted contact row via GET route handler. */
export async function fetchContactById(
  id: string
): Promise<ActionResponse<ContactRow>> {
  const response = await fetch(getContactsApiPath(`/api/contacts/${id}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ContactRow>(response, "Failed to load contact");
}

/**
 * Hook to manage the contact list with automatic encryption/decryption.
 *
 * When `initialEncryptedData` is provided (server-prefetched), the hook
 * decrypts it on first unlock before continuing with guarded refreshes.
 * Refresh responses are token-checked so stale requests cannot overwrite
 * newer optimistic UI state.
 *
 * Dashboard sheet editors receive this hook's `update` / `remove` / `refresh`
 * as props (Links pattern); they do not call {@link useContact}.
 */
export function useContacts(options?: UseContactsOptions): UseContactsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  const {
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
  } = useEncryptedSortableItems<
    Contact,
    ContactRow,
    ContactInput,
    ReorderUpdate
  >({
    navigationSource: "contacts-use-contacts",
    perfMeasureName: "contacts:list-refresh-duration",
    initialEncryptedData: options?.initialEncryptedData,
    masterKey,
    isUnlocked,
    loadFailureMessage: "Failed to load contacts",
    createFailureMessage: "Failed to create contact",
    updateFailureMessage: "Failed to update contact",
    deleteFailureMessage: "Failed to delete contact",
    reorderFailureMessage: "Failed to reorder contacts",
    decryptFailureMessage: "Failed to decrypt contacts",
    fetchRows: fetchContacts,
    createItem: (payload, csrfToken) =>
      createContact(payload as Parameters<typeof createContact>[0], csrfToken),
    updateItem: (payload, csrfToken) =>
      updateContact(payload as Parameters<typeof updateContact>[0], csrfToken),
    deleteItem: deleteContact,
    reorderEntities: (_table, updates, csrfToken) =>
      reorderContacts(updates, csrfToken),
    encryptInput: encryptContactInput,
    encryptUpdate: encryptContactUpdate,
    decryptRows: decryptContactRows,
    buildCreatePayload: (encrypted, input) => ({
      ...(encrypted as object),
      ...pickDefinedStructuralFields(input, CONTACT_STRUCTURAL_KEYS),
    }),
    buildUpdatePayload: (id, encrypted, input) => ({
      id,
      ...(encrypted as object),
      ...pickDefinedStructuralFields(input, CONTACT_STRUCTURAL_KEYS),
    }),
    buildOptimisticItem: (input, prev, created) => {
      const maxSortOrder =
        prev.length > 0 ? Math.max(...prev.map((c) => c.sort_order)) : -1;
      return {
        id: created.id,
        user_id: prev[0]?.user_id ?? "",
        first_name: input.first_name,
        last_name: input.last_name,
        description: input.description,
        email: input.email,
        phone: input.phone,
        birthday: input.birthday,
        notes: input.notes,
        category_id: input.category_id ?? DEFAULT_CONTACT_CATEGORY_ID,
        sort_order: maxSortOrder + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    applyReorderOptimistic: (prev, updates) => {
      const updatesById = new Map(updates.map((u) => [u.id, u]));
      const updated = prev.map((contact) => {
        const match = updatesById.get(contact.id);
        if (!match) return contact;
        return {
          ...contact,
          sort_order: match.sort_order,
          ...(match.category_id !== undefined && {
            category_id: match.category_id,
          }),
        };
      });
      return updated.toSorted((a, b) => a.sort_order - b.sort_order);
    },
  });

  return {
    contacts: items,
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

/** Options for useContact hook */
interface UseContactOptions {
  /** Server-prefetched encrypted row. Skips the initial fetch when provided. */
  initialEncryptedData?: ContactRow;
  /** Already decrypted row. Skips fetch/decrypt when provided. */
  initialData?: Contact;
}

/** Return type of the useContact hook for a single contact. */
interface UseContactReturn {
  /** The decrypted contact */
  contact: Contact | null;
  /** Whether the contact is being loaded */
  isLoading: boolean;
  /** User-visible error when the last contacts operation failed */
  error: string | null;
  /** Refresh the contact from server */
  refresh: () => Promise<void>;
  /** Update the contact */
  update: (input: Partial<ContactInput>) => Promise<boolean>;
  /** Delete the contact */
  remove: () => Promise<boolean>;
}

/**
 * Hook to fetch/update one contact by id (optional; not used by the dashboard sheet editor).
 */
export function useContact(
  id: string,
  options?: UseContactOptions
): UseContactReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  const { item, isLoading, error, refresh, update, remove } =
    useEncryptedSingleItem<
      Contact,
      ContactRow,
      ContactInput,
      Parameters<typeof updateContact>[0]
    >({
      id,
      navigationSource: "contacts-use-contacts",
      masterKey,
      isUnlocked,
      loadFailureMessage: "Failed to load contact",
      updateFailureMessage: "Failed to update contact",
      deleteFailureMessage: "Failed to delete contact",
      decryptFailureMessage: "Failed to decrypt contact",
      deleteMissingIdMessage:
        "We couldn't identify this contact. Please refresh and try again.",
      initialEncryptedData: options?.initialEncryptedData,
      initialData: options?.initialData,
      fetchById: fetchContactById,
      decryptRow: decryptContactRow,
      encryptUpdate: encryptContactUpdate,
      buildUpdatePayload: (entityId, encrypted, input) => ({
        id: entityId,
        ...encrypted,
        ...pickDefinedStructuralFields(input, CONTACT_STRUCTURAL_KEYS),
      }),
      updateEntity: updateContact,
      deleteEntity: deleteContact,
      patchEntity: patchSingleEntity,
    });

  return {
    contact: item,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
