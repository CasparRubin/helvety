"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect, useRef } from "react";

import {
  getContactTaskLinks,
  getTaskEntities,
  linkTaskEntity,
  unlinkTaskEntity,
} from "@/app/actions/task-link-actions";
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
  TaskEntityType,
  TaskEntitiesData,
  PickerUnit,
  PickerSpace,
  PickerItem,
} from "@/lib/types";

// =============================================================================
// Types
// =============================================================================

/** All decrypted picker entities (for the entity picker popover) */
export interface AllEntities {
  units: PickerUnit[];
  spaces: PickerSpace[];
  items: PickerItem[];
}

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
  /** All entities available for linking (decrypted, for the picker) */
  allEntities: AllEntities;
  /** Whether link data is being loaded */
  isLoading: boolean;
  /** Whether picker entities are being loaded */
  isLoadingEntities: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh link data from server */
  refresh: () => Promise<void>;
  /** Load all entities for the picker (call when picker opens) */
  loadEntities: () => Promise<void>;
  /** Link a task entity to this contact */
  link: (entityType: TaskEntityType, entityId: string) => Promise<boolean>;
  /** Unlink a task entity from this contact */
  unlink: (linkId: string) => Promise<boolean>;
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

/**
 * Decrypt all entity titles in a TaskEntitiesData response (for the picker).
 */
async function decryptEntitiesData(
  data: TaskEntitiesData,
  key: CryptoKey
): Promise<AllEntities> {
  const [units, spaces, items] = await Promise.all([
    Promise.all(
      data.units.map(async (u) => ({
        id: u.id,
        title: await decryptTitle(u.encrypted_title, key),
      }))
    ),
    Promise.all(
      data.spaces.map(async (s) => ({
        id: s.id,
        unit_id: s.unit_id,
        title: await decryptTitle(s.encrypted_title, key),
      }))
    ),
    Promise.all(
      data.items.map(async (i) => ({
        id: i.id,
        space_id: i.space_id,
        unit_id: i.unit_id,
        title: await decryptTitle(i.encrypted_title, key),
      }))
    ),
  ]);

  return { units, spaces, items };
}

// =============================================================================
// Hook
// =============================================================================

const EMPTY_ENTITIES: AllEntities = { units: [], spaces: [], items: [] };

/**
 * Hook to fetch, decrypt, link, and unlink task entity links for a contact.
 *
 * Reads from the shared `entity_contact_links` table and decrypts entity
 * titles client-side using the master encryption key. Also supports linking
 * and unlinking entities, and loading all entities for the picker.
 *
 * @param contactId - The contact UUID to manage task links for
 */
export function useTaskLinks(contactId: string): UseTaskLinksReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [units, setUnits] = useState<LinkedUnit[]>([]);
  const [spaces, setSpaces] = useState<LinkedSpace[]>([]);
  const [items, setItems] = useState<LinkedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Entity picker state
  const [allEntities, setAllEntities] = useState<AllEntities>(EMPTY_ENTITIES);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const entitiesCacheRef = useRef<AllEntities | null>(null);

  /**
   * Fetch and decrypt all linked entities for this contact
   */
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

  /**
   * Load all entities for the entity picker (lazy, cached).
   */
  const loadEntities = useCallback(async () => {
    // Return cached data if available
    if (entitiesCacheRef.current) {
      setAllEntities(entitiesCacheRef.current);
      return;
    }

    if (!masterKey || !isUnlocked) return;

    setIsLoadingEntities(true);

    try {
      const result = await getTaskEntities();
      if (!result.success) {
        setError(result.error);
        return;
      }

      const decrypted = await decryptEntitiesData(result.data, masterKey);
      entitiesCacheRef.current = decrypted;
      setAllEntities(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entities");
    } finally {
      setIsLoadingEntities(false);
    }
  }, [masterKey, isUnlocked]);

  /**
   * Link a task entity to this contact
   */
  const link = useCallback(
    async (entityType: TaskEntityType, entityId: string): Promise<boolean> => {
      try {
        const result = await linkTaskEntity(
          entityType,
          entityId,
          contactId,
          csrfToken
        );
        if (!result.success) {
          setError(result.error);
          return false;
        }

        // Refresh links to pick up the new link with full data
        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link entity");
        return false;
      }
    },
    [contactId, csrfToken, refresh]
  );

  /**
   * Unlink a task entity from this contact
   */
  const unlink = useCallback(
    async (linkId: string): Promise<boolean> => {
      try {
        const result = await unlinkTaskEntity(linkId, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to unlink entity");
          return false;
        }

        // Optimistically remove the link from local state
        setUnits((prev) => prev.filter((u) => u.link_id !== linkId));
        setSpaces((prev) => prev.filter((s) => s.link_id !== linkId));
        setItems((prev) => prev.filter((i) => i.link_id !== linkId));

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to unlink entity"
        );
        return false;
      }
    },
    [csrfToken]
  );

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
    allEntities,
    isLoading,
    isLoadingEntities,
    error,
    refresh,
    loadEntities,
    link,
    unlink,
  };
}
