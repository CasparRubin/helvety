"use client";

import { useState, useCallback, useEffect } from "react";

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
import { useCSRFToken } from "@/lib/csrf-client";

import type { Contact, ContactInput, ReorderUpdate } from "@/lib/types";

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

/**
 * Hook to manage Contacts with automatic encryption/decryption
 */
export function useContacts(): UseContactsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.error);
        setContacts([]);
        return;
      }

      const decrypted = await decryptContactRows(result.data, masterKey);
      setContacts(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  const create = useCallback(
    async (input: ContactInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
        return null;
      }

      try {
        const encrypted = await encryptContactInput(input, masterKey);
        const result = await createContact(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create contact"
        );
        return null;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const update = useCallback(
    async (id: string, input: Partial<ContactInput>): Promise<boolean> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return false;
      }
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
        return false;
      }

      try {
        const encrypted = await encryptContactUpdate(input, masterKey);
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
          setError(result.error ?? "Failed to update contact");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update contact"
        );
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
        const result = await deleteContact(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete contact");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete contact"
        );
        return false;
      }
    },
    [csrfToken, refresh]
  );

  /**
   * Batch reorder contacts (for drag-and-drop)
   */
  const reorder = useCallback(
    async (updates: ReorderUpdate[]): Promise<boolean> => {
      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      // Optimistic update
      setContacts((prev) => {
        const updated = prev.map((contact) => {
          const match = updates.find((u) => u.id === contact.id);
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
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderContacts(updates, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to reorder contacts");
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder contacts"
        );
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh]
  );

  useEffect(() => {
    if (isUnlocked && masterKey) {
      void refresh();
    }
  }, [isUnlocked, masterKey, refresh]);

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
export function useContact(id: string): UseContactReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.error);
        setContact(null);
        return;
      }

      const decrypted = await decryptContactRow(result.data, masterKey);
      setContact(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contact");
      setContact(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<ContactInput>): Promise<boolean> => {
      if (!masterKey || !csrfToken || !id) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptContactUpdate(input, masterKey);
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
          setError(result.error ?? "Failed to update contact");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update contact"
        );
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
      const result = await deleteContact(id, csrfToken);
      if (!result.success) {
        setError(result.error ?? "Failed to delete contact");
        return false;
      }

      setContact(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
      return false;
    }
  }, [id, csrfToken]);

  useEffect(() => {
    if (isUnlocked && masterKey && id) {
      void refresh();
    }
  }, [isUnlocked, masterKey, id, refresh]);

  return {
    contact,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
