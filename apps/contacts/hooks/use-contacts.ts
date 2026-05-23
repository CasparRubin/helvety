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
  /** Apply a local optimistic patch without a server request */
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
async function fetchContactById(
  id: string
): Promise<ActionResponse<ContactRow>> {
  const response = await fetch(getContactsApiPath(`/api/contacts/${id}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ContactRow>(response, "Failed to load contact");
}

/**
 * Hook to manage Contacts with automatic encryption/decryption.
 *
 * When `initialEncryptedData` is provided (server-prefetched), the hook
 * decrypts it on first unlock before continuing with guarded refreshes.
 * Refresh responses are token-checked so stale requests cannot overwrite
 * newer optimistic UI state.
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
    buildCreatePayload: (encrypted) => encrypted,
    buildUpdatePayload: (id, encrypted, input) => ({
      id,
      ...(encrypted as object),
      ...(input.category_id !== undefined
        ? { category_id: input.category_id }
        : {}),
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
 * Hook to manage a single Contact by ID
 */
export function useContact(
  id: string,
  options?: UseContactOptions
): UseContactReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setContact(null);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchContactById(id);
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          reportE2eeActionFailure(result.error, {
            source: "contacts-use-contacts",
            fallback: "Failed to load contact",
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
        setContact(null);
        return;
      }

      const decrypted = await decryptContactRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setContact(decrypted);
    } catch (err) {
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      reportE2eeHookError(err, {
        source: "contacts-use-contacts",
        fallback: "Failed to load contact",
        setError,
        redirectUri: routeAtStart,
        expectedRoute: routeAtStart,
        requestStartedAt,
      });
      setContact(null);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<ContactInput>): Promise<boolean> => {
      if (!masterKey || !id) {
        triggerHardLogoutOnce(window.location.href, "contacts-use-contacts");
        return false;
      }

      try {
        const encrypted = await encryptContactUpdate(id, input, masterKey);
        const result = await updateContact(
          {
            id,
            ...encrypted,
            ...(input.category_id !== undefined && {
              category_id: input.category_id,
            }),
          },
          csrfToken
        );
        if (!result.success) {
          reportE2eeActionFailure(result.error, {
            source: "contacts-use-contacts",
            fallback: "Failed to update contact",
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setContact((prev) => patchSingleEntity(prev, input));

        return true;
      } catch (err) {
        reportE2eeHookError(err, {
          source: "contacts-use-contacts",
          fallback: "Failed to update contact",
        });
        return false;
      }
    },
    [id, masterKey, csrfToken]
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) {
      toast.error(
        "We couldn't identify this contact. Please refresh and try again.",
        {
          duration: TOAST_DURATIONS.ERROR,
        }
      );
      return false;
    }

    try {
      const result = await deleteContact(id, csrfToken);
      if (!result.success) {
        reportE2eeActionFailure(result.error, {
          source: "contacts-use-contacts",
          fallback: "Failed to delete contact",
        });
        return false;
      }

      setContact(null);
      return true;
    } catch (err) {
      reportE2eeHookError(err, {
        source: "contacts-use-contacts",
        fallback: "Failed to delete contact",
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
      setContact(options.initialData);
      setIsLoading(false);
      return;
    }

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptContactRow(options.initialEncryptedData, masterKey)
        .then((decrypted) => setContact(decrypted))
        .catch((err) => {
          reportE2eeHookError(err, {
            source: "contacts-use-contacts",
            fallback: "Failed to decrypt contact",
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
    contact,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
