"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect } from "react";

import {
  getSpaces,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  reorderEntities,
} from "@/app/actions/task-actions";
import {
  useEncryptionContext,
  encryptSpaceInput,
  encryptSpaceUpdate,
  decryptSpaceRows,
  decryptSpaceRow,
} from "@/lib/crypto";

import type { Space, SpaceInput, ReorderUpdate } from "@/lib/types";

/** Return type of useSpaces hook (spaces list, CRUD, reorder). */
interface UseSpacesReturn {
  /** List of decrypted spaces */
  spaces: Space[];
  /** Whether spaces are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh spaces from server */
  refresh: () => Promise<void>;
  /** Create a new space */
  create: (input: SpaceInput) => Promise<{ id: string } | null>;
  /** Update a space */
  update: (
    id: string,
    input: Partial<Omit<SpaceInput, "unit_id">>
  ) => Promise<boolean>;
  /** Delete a space */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder spaces (for drag-and-drop) */
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
}

/**
 * Hook to manage Spaces for a specific Unit with automatic encryption/decryption
 */
export function useSpaces(unitId: string): UseSpacesReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and decrypt all spaces for the unit
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !unitId) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSpaces(unitId);
      if (!result.success) {
        setError(result.error);
        setSpaces([]);
        return;
      }

      // Decrypt all spaces client-side
      const decrypted = await decryptSpaceRows(result.data, masterKey);
      setSpaces(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch spaces");
      setSpaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [unitId, masterKey, isUnlocked]);

  /**
   * Create a new space
   */
  const create = useCallback(
    async (input: SpaceInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        // Encrypt the input client-side
        const encrypted = await encryptSpaceInput(input, masterKey);

        // Send encrypted data to server
        const result = await createSpace(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        // Optimistic update: add the new space to local state
        setSpaces((prev) => {
          const maxSortOrder =
            prev.length > 0 ? Math.max(...prev.map((s) => s.sort_order)) : -1;
          const newSpace: Space = {
            id: result.data.id,
            unit_id: input.unit_id,
            user_id: prev[0]?.user_id ?? "",
            title: input.title,
            description: input.description,
            stage_id: input.stage_id ?? null,
            sort_order: maxSortOrder + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...prev, newSpace].sort(
            (a, b) => a.sort_order - b.sort_order
          );
        });

        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create space");
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  /**
   * Update a space
   */
  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<SpaceInput, "unit_id">>
    ): Promise<boolean> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        // Encrypt the update fields
        const encrypted = await encryptSpaceUpdate(id, input, masterKey);

        // Send encrypted data to server
        const result = await updateSpace({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update space");
          return false;
        }

        // Optimistic update: merge changes into local state
        setSpaces((prev) =>
          prev.map((space) => {
            if (space.id !== id) return space;
            return {
              ...space,
              ...(input.title !== undefined && { title: input.title }),
              ...(input.description !== undefined && {
                description: input.description,
              }),
              ...(input.stage_id !== undefined && {
                stage_id: input.stage_id ?? null,
              }),
              updated_at: new Date().toISOString(),
            };
          })
        );

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update space");
        return false;
      }
    },
    [masterKey, csrfToken]
  );

  /**
   * Delete a space
   */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic delete: remove from state immediately, rollback on failure
      let prevSpaces: Space[] = [];
      setSpaces((prev) => {
        prevSpaces = prev;
        return prev.filter((space) => space.id !== id);
      });

      try {
        const result = await deleteSpace(id, csrfToken);
        if (!result.success) {
          setSpaces(prevSpaces);
          setError(result.error ?? "Failed to delete space");
          return false;
        }

        return true;
      } catch (err) {
        setSpaces(prevSpaces);
        setError(err instanceof Error ? err.message : "Failed to delete space");
        return false;
      }
    },
    [csrfToken]
  );

  /**
   * Batch reorder spaces (for drag-and-drop)
   */
  const reorder = useCallback(
    async (updates: ReorderUpdate[]): Promise<boolean> => {
      // Optimistic update
      setSpaces((prev) => {
        const updated = prev.map((space) => {
          const match = updates.find((u) => u.id === space.id);
          if (!match) return space;
          return {
            ...space,
            sort_order: match.sort_order,
            stage_id:
              match.stage_id !== undefined ? match.stage_id : space.stage_id,
          };
        });
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderEntities("space", updates, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to reorder spaces");
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder spaces"
        );
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh]
  );

  // Fetch spaces when encryption is unlocked
  useEffect(() => {
    if (isUnlocked && masterKey && unitId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, unitId, refresh]);

  return {
    spaces,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}

/** Return type of useSpace hook for a single space. */
interface UseSpaceReturn {
  /** The decrypted space */
  space: Space | null;
  /** Whether the space is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh the space from server */
  refresh: () => Promise<void>;
  /** Update the space */
  update: (input: Partial<Omit<SpaceInput, "unit_id">>) => Promise<boolean>;
  /** Delete the space */
  remove: () => Promise<boolean>;
}

/**
 * Hook to manage a single Space by ID
 */
export function useSpace(id: string): UseSpaceReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [space, setSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setSpace(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSpace(id);
      if (!result.success) {
        setError(result.error);
        setSpace(null);
        return;
      }

      const decrypted = await decryptSpaceRow(result.data, masterKey);
      setSpace(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch space");
      setSpace(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<Omit<SpaceInput, "unit_id">>): Promise<boolean> => {
      if (!masterKey || !id) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptSpaceUpdate(id, input, masterKey);
        const result = await updateSpace({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update space");
          return false;
        }

        // Optimistic update: merge changes into local state
        setSpace((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(input.title !== undefined && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
            ...(input.stage_id !== undefined && {
              stage_id: input.stage_id ?? null,
            }),
            updated_at: new Date().toISOString(),
          };
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update space");
        return false;
      }
    },
    [id, masterKey, csrfToken]
  );

  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) {
      setError("Invalid or missing ID");
      return false;
    }

    try {
      const result = await deleteSpace(id, csrfToken);
      if (!result.success) {
        setError(result.error ?? "Failed to delete space");
        return false;
      }

      setSpace(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete space");
      return false;
    }
  }, [id, csrfToken]);

  useEffect(() => {
    if (isUnlocked && masterKey && id) {
      void refresh();
    }
  }, [isUnlocked, masterKey, id, refresh]);

  return {
    space,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
