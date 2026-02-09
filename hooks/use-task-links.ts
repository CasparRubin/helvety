"use client";

import { useState, useCallback, useEffect } from "react";

import { getContactTaskLinks } from "@/app/actions/task-link-actions";
import {
  useEncryptionContext,
  decrypt,
  parseEncryptedData,
} from "@/lib/crypto";

import type {
  LinkedUnit,
  LinkedSpace,
  LinkedItem,
  TaskLinkData,
} from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

/** Return type of the useTaskLinks hook */
export interface UseTaskLinksReturn {
  /** Decrypted linked units */
  units: LinkedUnit[];
  /** Decrypted linked spaces (with unit_id for deep links) */
  spaces: LinkedSpace[];
  /** Decrypted linked items (with space_id + unit_id for deep links) */
  items: LinkedItem[];
  /** Total number of linked entities across all types */
  totalCount: number;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh data from server */
  refresh: () => Promise<void>;
}

// =============================================================================
// Decryption helpers
// =============================================================================

/**
 * Decrypt an encrypted_title string using the master key.
 * Returns the plaintext title, or a fallback string on failure.
 */
async function decryptTitle(
  encryptedTitle: string,
  key: CryptoKey
): Promise<string> {
  try {
    const parsed = parseEncryptedData(encryptedTitle);
    return await decrypt(parsed, key);
  } catch {
    return "(encrypted)";
  }
}

/**
 * Decrypt all entity titles in a TaskLinkData response.
 */
async function decryptTaskLinkData(
  data: TaskLinkData,
  key: CryptoKey
): Promise<{
  units: LinkedUnit[];
  spaces: LinkedSpace[];
  items: LinkedItem[];
}> {
  const [units, spaces, items] = await Promise.all([
    Promise.all(
      data.units.map(async (u) => ({
        id: u.id,
        title: await decryptTitle(u.encrypted_title, key),
        link_id: u.link_id,
        linked_at: u.linked_at,
      }))
    ),
    Promise.all(
      data.spaces.map(async (s) => ({
        id: s.id,
        unit_id: s.unit_id,
        title: await decryptTitle(s.encrypted_title, key),
        link_id: s.link_id,
        linked_at: s.linked_at,
      }))
    ),
    Promise.all(
      data.items.map(async (i) => ({
        id: i.id,
        space_id: i.space_id,
        unit_id: i.unit_id,
        title: await decryptTitle(i.encrypted_title, key),
        link_id: i.link_id,
        linked_at: i.linked_at,
      }))
    ),
  ]);

  return { units, spaces, items };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to fetch and decrypt task entity links for a contact.
 *
 * Reads from the shared `entity_contact_links` table (read-only) and
 * decrypts entity titles client-side using the master encryption key.
 *
 * @param contactId - The contact UUID to find task links for
 */
export function useTaskLinks(contactId: string): UseTaskLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();

  const [units, setUnits] = useState<LinkedUnit[]>([]);
  const [spaces, setSpaces] = useState<LinkedSpace[]>([]);
  const [items, setItems] = useState<LinkedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !contactId) {
      setUnits([]);
      setSpaces([]);
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getContactTaskLinks(contactId);
      if (!result.success) {
        setError(result.error);
        setUnits([]);
        setSpaces([]);
        setItems([]);
        return;
      }

      const decrypted = await decryptTaskLinkData(result.data, masterKey);
      setUnits(decrypted.units);
      setSpaces(decrypted.spaces);
      setItems(decrypted.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch task links"
      );
      setUnits([]);
      setSpaces([]);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [contactId, masterKey, isUnlocked]);

  // Auto-fetch when encryption is unlocked or contactId changes
  useEffect(() => {
    if (isUnlocked && masterKey && contactId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, contactId, refresh]);

  return {
    units,
    spaces,
    items,
    totalCount: units.length + spaces.length + items.length,
    isLoading,
    error,
    refresh,
  };
}
