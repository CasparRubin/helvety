"use client";

import {
  normalizeActionError,
  shouldForceHardLogout,
} from "@helvety/shared/auth-errors";
import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { forceHardLogout } from "@helvety/ui/hard-logout";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  reorderContacts,
} from "@/app/actions/contact-actions";
import {
  useEncryptionContext,
  encryptContactInput,
  encryptContactUpdate,
  decryptContactRows,
  decryptContactRow,
} from "@/lib/crypto";

import type {
  Contact,
  ContactInput,
  ContactRow,
  ReorderUpdate,
} from "@/lib/types";

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
  /** Error message if something went wrong */
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
}

/** Force the centralized logout flow when auth/E2EE state is invalid. */
function triggerHardLogoutForError(rawError?: string | null): boolean {
  const normalized = normalizeActionError(rawError);
  if (!shouldForceHardLogout(normalized)) {
    return false;
  }
  void forceHardLogout(window.location.href);
  return true;
}

/**
 * Hook to manage Contacts with automatic encryption/decryption.
 *
 * When `initialEncryptedData` is provided (server-prefetched), the hook
 * decrypts it on first unlock instead of making a round-trip to the server.
 */
export function useContacts(options?: UseContactsOptions): UseContactsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getContacts();
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return;
        }
        const msg = result.error ?? "Failed to fetch contacts";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setContacts([]);
        return;
      }

      const decrypted = await decryptContactRows(result.data, masterKey);
      setContacts(decrypted);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch contacts";
      if (triggerHardLogoutForError(msg)) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  const create = useCallback(
    async (input: ContactInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        void forceHardLogout(window.location.href);
        return null;
      }

      try {
        const encrypted = await encryptContactInput(input, masterKey);
        const result = await createContact(encrypted, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
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
            category_id: input.category_id ?? null,
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
    async (id: string, input: Partial<ContactInput>): Promise<boolean> => {
      if (!masterKey) {
        void forceHardLogout(window.location.href);
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setContacts((prev) =>
          prev.map((contact) => {
            if (contact.id !== id) return contact;
            return {
              ...contact,
              ...(input.first_name !== undefined && {
                first_name: input.first_name,
              }),
              ...(input.last_name !== undefined && {
                last_name: input.last_name,
              }),
              ...(input.description !== undefined && {
                description: input.description,
              }),
              ...(input.email !== undefined && { email: input.email }),
              ...(input.phone !== undefined && { phone: input.phone }),
              ...(input.birthday !== undefined && { birthday: input.birthday }),
              ...(input.notes !== undefined && { notes: input.notes }),
              ...(input.category_id !== undefined && {
                category_id: input.category_id ?? null,
              }),
              updated_at: new Date().toISOString(),
            };
          })
        );

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update contact";
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
      let prevContacts: Contact[] = [];
      setContacts((prev) => {
        prevContacts = prev;
        return prev.filter((contact) => contact.id !== id);
      });

      try {
        const result = await deleteContact(id, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
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
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        setContacts(prevContacts);
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        return false;
      }
    },
    [csrfToken]
  );

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
            category_id:
              match.category_id !== undefined
                ? match.category_id
                : contact.category_id,
          };
        });
        return updated.toSorted((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderContacts(updates, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
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
        if (triggerHardLogoutForError(message)) {
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
    refresh,
    options?.initialEncryptedData,
    initialDataConsumed,
  ]);

  return {
    contacts,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}

/** Options for useContact hook */
interface UseContactOptions {
  /** Server-prefetched encrypted row. Skips the initial fetch when provided. */
  initialEncryptedData?: ContactRow;
}

/** Return type of the useContact hook for a single contact. */
interface UseContactReturn {
  /** The decrypted contact */
  contact: Contact | null;
  /** Whether the contact is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
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

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setContact(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getContact(id);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return;
        }
        const msg = result.error ?? "Failed to fetch contact";
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setContact(null);
        return;
      }

      const decrypted = await decryptContactRow(result.data, masterKey);
      setContact(decrypted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch contact";
      if (triggerHardLogoutForError(message)) {
        return;
      }
      setError(message);
      setContact(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<ContactInput>): Promise<boolean> => {
      if (!masterKey || !id) {
        void forceHardLogout(window.location.href);
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update contact", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        // Optimistic update: merge changes into local state
        setContact((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(input.first_name !== undefined && {
              first_name: input.first_name,
            }),
            ...(input.last_name !== undefined && {
              last_name: input.last_name,
            }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.email !== undefined && { email: input.email }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.birthday !== undefined && { birthday: input.birthday }),
            ...(input.notes !== undefined && { notes: input.notes }),
            ...(input.category_id !== undefined && {
              category_id: input.category_id ?? null,
            }),
            updated_at: new Date().toISOString(),
          };
        });

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update contact";
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
      toast.error("Contact ID not available", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return false;
    }

    try {
      const result = await deleteContact(id, csrfToken);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
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
      decryptContactRow(options.initialEncryptedData, masterKey)
        .then((decrypted) => setContact(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt contact";
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
    contact,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
