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
async function fetchContacts(): Promise<ActionResponse<ContactRow[]>> {
  const response = await fetch(getContactsApiPath("/api/contacts"), {
    method: "GET",
    cache: "no-store",
  });
  return parseActionResponse<ContactRow[]>(response, "Failed to load contacts");
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
  const csrfToken = useCSRFToken();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setContacts([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const perfLabel = `contacts:list-refresh:${refreshToken}`;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    performance.mark(`${perfLabel}:start`);
    const hasExistingContacts = contacts.length > 0;
    if (hasExistingContacts) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetchContacts();
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          triggerE2eeHookAuthErrorNavigation(
            "contacts-use-contacts",
            result.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        const msg = result.error ?? "Failed to load contacts";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        if (!hasExistingContacts) {
          setContacts([]);
        }
        return;
      }

      const decrypted = await decryptContactRows(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setContacts(decrypted);
      performance.mark(`${perfLabel}:end`);
      performance.measure(
        "contacts:list-refresh-duration",
        `${perfLabel}:start`,
        `${perfLabel}:end`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load contacts";
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      if (
        triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      if (!hasExistingContacts) {
        setContacts([]);
      }
    } finally {
      performance.clearMarks(`${perfLabel}:start`);
      performance.clearMarks(`${perfLabel}:end`);
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [contacts.length, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: ContactInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "contacts-use-contacts");
        return null;
      }

      try {
        const encrypted = await encryptContactInput(input, masterKey);
        const result = await createContact(encrypted, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-contacts",
              result.error
            )
          ) {
            return null;
          }
          toast.error(result.error ?? "Failed to create contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return null;
        }

        // Optimistic update: add the new contact to local state
        setContacts((prev) => {
          const maxSortOrder =
            prev.length > 0 ? Math.max(...prev.map((c) => c.sort_order)) : -1;
          const newContact: Contact = {
            id: result.data.id,
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
          return [...prev, newContact].toSorted(
            (a, b) => a.sort_order - b.sort_order
          );
        });

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create contact";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message)
        ) {
          return null;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  const update = useCallback(
    async (id: string, input: Partial<ContactInput>): Promise<boolean> => {
      if (!masterKey) {
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
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-contacts",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to update contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setContacts((prev) => patchEntityInList(prev, id, input));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update contact";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message)
        ) {
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
      let prevContacts: Contact[] = [];
      setContacts((prev) => {
        prevContacts = prev;
        return prev.filter((contact) => contact.id !== id);
      });

      try {
        const result = await deleteContact(id, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-contacts",
              result.error
            )
          ) {
            return false;
          }
          setContacts(prevContacts);
          toast.error(result.error ?? "Failed to delete contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete contact";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message)
        ) {
          return false;
        }
        setContacts(prevContacts);
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken]
  );

  const patchLocal = useCallback((id: string, input: Partial<ContactInput>) => {
    setContacts((prev) => patchEntityInList(prev, id, input));
  }, []);

  /**
   * Batch reorder contacts (for drag-and-drop)
   */
  const reorder = useCallback(
    async (updates: ReorderUpdate[]): Promise<boolean> => {
      // Optimistic update
      setContacts((prev) => {
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
      });

      try {
        const result = await reorderContacts(updates, csrfToken);
        if (!result.success) {
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-contacts",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to reorder contacts", {
            duration: TOAST_DURATIONS.ERROR,
          });
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reorder contacts";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message)
        ) {
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

    // Use server-prefetched data on first unlock to avoid a round-trip
    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptContactRows(options.initialEncryptedData, masterKey)
        .then((decrypted) => setContacts(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt contacts";
          if (
            triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", msg)
          ) {
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
    contacts,
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
          triggerE2eeHookAuthErrorNavigation(
            "contacts-use-contacts",
            result.error,
            {
              redirectUri: routeAtStart,
              expectedRoute: routeAtStart,
              requestStartedAt,
            }
          )
        ) {
          return;
        }
        const msg = result.error ?? "Failed to load contact";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setContact(null);
        return;
      }

      const decrypted = await decryptContactRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setContact(decrypted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load contact";
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      if (
        triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(message);
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
          if (
            triggerE2eeHookAuthErrorNavigation(
              "contacts-use-contacts",
              result.error
            )
          ) {
            return false;
          }
          toast.error(result.error ?? "Failed to update contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setContact((prev) => patchSingleEntity(prev, input));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update contact";
        if (
          triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message)
        ) {
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
        if (
          triggerE2eeHookAuthErrorNavigation(
            "contacts-use-contacts",
            result.error
          )
        ) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete contact", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }

      setContact(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete contact";
      if (
        triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", message)
      ) {
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
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt contact";
          if (
            triggerE2eeHookAuthErrorNavigation("contacts-use-contacts", msg)
          ) {
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
    contact,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
