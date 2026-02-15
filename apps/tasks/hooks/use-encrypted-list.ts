"use client";

import { useState, useCallback, useEffect } from "react";

import { useEncryptionContext } from "@/lib/crypto";

import type { ActionResponse } from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

/** Configuration for the useEncryptedList hook. */
export interface UseEncryptedListConfig<TRow, TDecrypted> {
  /**
   * Server action that fetches the encrypted rows.
   * Called on refresh and initial load.
   */
  fetchAction: () => Promise<ActionResponse<TRow[]>>;

  /**
   * Client-side decryption function.
   * Receives the encrypted rows and the master key, returns decrypted entities.
   */
  decryptFn: (rows: TRow[], masterKey: CryptoKey) => Promise<TDecrypted[]>;

  /** Human-readable entity name for error messages (e.g. "contacts", "units"). */
  entityName: string;
}

/** Return type of the useEncryptedList hook. */
export interface UseEncryptedListReturn<TDecrypted> {
  /** List of decrypted entities */
  items: TDecrypted[];
  /** Replace the local list (for optimistic updates from the parent hook) */
  setItems: React.Dispatch<React.SetStateAction<TDecrypted[]>>;
  /** Whether the list is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Set a custom error message */
  setError: (error: string | null) => void;
  /** Re-fetch and decrypt from server */
  refresh: () => Promise<void>;
  /** Whether encryption is unlocked and a master key is available */
  isReady: boolean;
  /** The master key, if available */
  masterKey: CryptoKey | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Generic hook for fetching and decrypting an encrypted entity list.
 *
 * Encapsulates the common pattern shared by all E2EE entity hooks:
 * 1. Wait for encryption to be unlocked
 * 2. Fetch encrypted rows via a server action
 * 3. Decrypt client-side using the master key
 * 4. Manage loading/error state and auto-refresh on unlock
 *
 * CRUD operations and optimistic updates remain in each entity-specific hook,
 * since they depend on entity-specific types, encryption functions, and
 * optimistic update logic.
 *
 * @example
 * ```ts
 * const { items: contacts, isLoading, error, refresh, setItems, masterKey } =
 *   useEncryptedList({
 *     fetchAction: getContacts,
 *     decryptFn: decryptContactRows,
 *     entityName: "contacts",
 *   });
 * ```
 */
export function useEncryptedList<TRow, TDecrypted>(
  config: UseEncryptedListConfig<TRow, TDecrypted>
): UseEncryptedListReturn<TDecrypted> {
  const { fetchAction, decryptFn, entityName } = config;
  const { masterKey, isUnlocked } = useEncryptionContext();

  const [items, setItems] = useState<TDecrypted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAction();
      if (!result.success) {
        setError(result.error);
        setItems([]);
        return;
      }

      const decrypted = await decryptFn(result.data, masterKey);
      setItems(decrypted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to fetch ${entityName}`
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked, fetchAction, decryptFn, entityName]);

  // Auto-refresh when encryption becomes available
  useEffect(() => {
    if (isUnlocked && masterKey) {
      void refresh();
    }
  }, [isUnlocked, masterKey, refresh]);

  return {
    items,
    setItems,
    isLoading,
    error,
    setError,
    refresh,
    isReady: isUnlocked && !!masterKey,
    masterKey: masterKey ?? null,
  };
}
