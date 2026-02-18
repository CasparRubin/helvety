"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect } from "react";

import {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  reorderEntities,
} from "@/app/actions/task-actions";
import {
  useEncryptionContext,
  encryptUnitInput,
  encryptUnitUpdate,
  decryptUnitRows,
  decryptUnitRow,
} from "@/lib/crypto";

import type { Unit, UnitInput, ReorderUpdate } from "@/lib/types";

/** Return type of useUnits hook (units list, CRUD, reorder). */
interface UseUnitsReturn {
  /** List of decrypted units */
  units: Unit[];
  /** Whether units are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh units from server */
  refresh: () => Promise<void>;
  /** Create a new unit */
  create: (input: UnitInput) => Promise<{ id: string } | null>;
  /** Update a unit */
  update: (id: string, input: Partial<UnitInput>) => Promise<boolean>;
  /** Delete a unit */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder units (for drag-and-drop) */
  reorder: (updates: ReorderUpdate[]) => Promise<boolean>;
}

/**
 * Hook to manage Units with automatic encryption/decryption
 * Handles fetching, creating, updating, and deleting units
 */
export function useUnits(): UseUnitsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and decrypt all units
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setUnits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUnits();
      if (!result.success) {
        setError(result.error);
        setUnits([]);
        return;
      }

      // Decrypt all units client-side
      const decrypted = await decryptUnitRows(result.data, masterKey);
      setUnits(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch units");
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  /**
   * Create a new unit
   */
  const create = useCallback(
    async (input: UnitInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        // Encrypt the input client-side
        const encrypted = await encryptUnitInput(input, masterKey);

        // Send encrypted data to server
        const result = await createUnit(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        // Optimistic update: add the new unit to local state
        setUnits((prev) => {
          const maxSortOrder =
            prev.length > 0 ? Math.max(...prev.map((u) => u.sort_order)) : -1;
          const newUnit: Unit = {
            id: result.data.id,
            user_id: prev[0]?.user_id ?? "",
            title: input.title,
            description: input.description,
            stage_id: input.stage_id ?? null,
            sort_order: maxSortOrder + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...prev, newUnit].sort((a, b) => a.sort_order - b.sort_order);
        });

        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create unit");
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  /**
   * Update a unit
   */
  const update = useCallback(
    async (id: string, input: Partial<UnitInput>): Promise<boolean> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        // Encrypt the update fields
        const encrypted = await encryptUnitUpdate(id, input, masterKey);

        // Send encrypted data to server
        const result = await updateUnit({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update unit");
          return false;
        }

        // Optimistic update: merge changes into local state
        setUnits((prev) =>
          prev.map((unit) => {
            if (unit.id !== id) return unit;
            return {
              ...unit,
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
        setError(err instanceof Error ? err.message : "Failed to update unit");
        return false;
      }
    },
    [masterKey, csrfToken]
  );

  /**
   * Delete a unit
   */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic delete: remove from state immediately, rollback on failure
      let prevUnits: Unit[] = [];
      setUnits((prev) => {
        prevUnits = prev;
        return prev.filter((unit) => unit.id !== id);
      });

      try {
        const result = await deleteUnit(id, csrfToken);
        if (!result.success) {
          setUnits(prevUnits);
          setError(result.error ?? "Failed to delete unit");
          return false;
        }

        return true;
      } catch (err) {
        setUnits(prevUnits);
        setError(err instanceof Error ? err.message : "Failed to delete unit");
        return false;
      }
    },
    [csrfToken]
  );

  /**
   * Batch reorder units (for drag-and-drop)
   * Optimistically updates local state before server confirmation
   */
  const reorder = useCallback(
    async (updates: ReorderUpdate[]): Promise<boolean> => {
      // Optimistic update
      setUnits((prev) => {
        const updated = prev.map((unit) => {
          const match = updates.find((u) => u.id === unit.id);
          if (!match) return unit;
          return {
            ...unit,
            sort_order: match.sort_order,
            stage_id:
              match.stage_id !== undefined ? match.stage_id : unit.stage_id,
          };
        });
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderEntities("unit", updates, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to reorder units");
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder units"
        );
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh]
  );

  // Fetch units when encryption is unlocked
  useEffect(() => {
    if (isUnlocked && masterKey) {
      void refresh();
    }
  }, [isUnlocked, masterKey, refresh]);

  return {
    units,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}

/** Return type of useUnit hook for a single unit. */
interface UseUnitReturn {
  /** The decrypted unit */
  unit: Unit | null;
  /** Whether the unit is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh the unit from server */
  refresh: () => Promise<void>;
  /** Update the unit */
  update: (input: Partial<UnitInput>) => Promise<boolean>;
  /** Delete the unit */
  remove: () => Promise<boolean>;
}

/**
 * Hook to manage a single Unit by ID
 */
export function useUnit(id: string): UseUnitReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and decrypt the unit
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setUnit(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUnit(id);
      if (!result.success) {
        setError(result.error);
        setUnit(null);
        return;
      }

      // Decrypt the unit client-side
      const decrypted = await decryptUnitRow(result.data, masterKey);
      setUnit(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch unit");
      setUnit(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, masterKey, isUnlocked]);

  /**
   * Update the unit
   */
  const update = useCallback(
    async (input: Partial<UnitInput>): Promise<boolean> => {
      if (!masterKey || !id) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptUnitUpdate(id, input, masterKey);
        const result = await updateUnit({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update unit");
          return false;
        }

        // Optimistic update: merge changes into local state
        setUnit((prev) => {
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
        setError(err instanceof Error ? err.message : "Failed to update unit");
        return false;
      }
    },
    [id, masterKey, csrfToken]
  );

  /**
   * Delete the unit
   */
  const remove = useCallback(async (): Promise<boolean> => {
    if (!id) {
      setError("Invalid or missing ID");
      return false;
    }

    try {
      const result = await deleteUnit(id, csrfToken);
      if (!result.success) {
        setError(result.error ?? "Failed to delete unit");
        return false;
      }

      setUnit(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete unit");
      return false;
    }
  }, [id, csrfToken]);

  // Fetch unit when encryption is unlocked
  useEffect(() => {
    if (isUnlocked && masterKey && id) {
      void refresh();
    }
  }, [isUnlocked, masterKey, id, refresh]);

  return {
    unit,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
