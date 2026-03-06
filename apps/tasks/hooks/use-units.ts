"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import {
  handleAuthErrorNavigation,
  triggerHardLogoutOnce,
} from "@helvety/ui/auth-navigation";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

import type { Unit, UnitInput, UnitRow, ReorderUpdate } from "@/lib/types";

/** Options for useUnits hook */
interface UseUnitsOptions {
  /** Server-prefetched encrypted rows. Skips the initial fetch when provided. */
  initialEncryptedData?: UnitRow[];
}

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

/** Routes auth/E2EE failures to login or hard-logout via shared navigation. */
function triggerHardLogoutForError(
  rawError?: string | null,
  options?: {
    redirectUri?: string;
    expectedRoute?: string;
    requestStartedAt?: number;
  }
): boolean {
  return handleAuthErrorNavigation(
    rawError,
    options?.redirectUri ?? window.location.href,
    "tasks-use-units",
    {
      expectedRoute: options?.expectedRoute,
      requestStartedAt: options?.requestStartedAt,
    }
  );
}

/**
 * Hook to manage Units with automatic encryption/decryption
 * Handles fetching, creating, updating, and deleting units
 */
export function useUnits(options?: UseUnitsOptions): UseUnitsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  /**
   * Fetch and decrypt all units
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setUnits([]);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUnits();
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          triggerHardLogoutForError(result.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = result.error ?? "Failed to fetch units";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setUnits([]);
        return;
      }

      // Decrypt all units client-side
      const decrypted = await decryptUnitRows(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setUnits(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch units";
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      if (
        triggerHardLogoutForError(msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setUnits([]);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [masterKey, isUnlocked]);

  /**
   * Create a new unit
   */
  const create = useCallback(
    async (input: UnitInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-units");
        return null;
      }

      try {
        // Encrypt the input client-side
        const encrypted = await encryptUnitInput(input, masterKey);

        // Send encrypted data to server
        const result = await createUnit(encrypted, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return null;
          }
          toast.error(result.error ?? "Failed to create unit", {
            duration: TOAST_DURATIONS.ERROR,
          });
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
          return [...prev, newUnit].toSorted(
            (a, b) => a.sort_order - b.sort_order
          );
        });

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create unit";
        if (triggerHardLogoutForError(message)) {
          return null;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
        triggerHardLogoutOnce(window.location.href, "tasks-use-units");
        return false;
      }

      try {
        // Encrypt the update fields
        const encrypted = await encryptUnitUpdate(id, input, masterKey);

        // Send encrypted data to server
        const result = await updateUnit({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update unit", {
            duration: TOAST_DURATIONS.ERROR,
          });
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
        const message =
          err instanceof Error ? err.message : "Failed to update unit";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          setUnits(prevUnits);
          toast.error(result.error ?? "Failed to delete unit", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete unit";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        setUnits(prevUnits);
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
        const updatesById = new Map(updates.map((u) => [u.id, u]));
        const updated = prev.map((unit) => {
          const match = updatesById.get(unit.id);
          if (!match) return unit;
          return {
            ...unit,
            sort_order: match.sort_order,
            stage_id:
              match.stage_id !== undefined ? match.stage_id : unit.stage_id,
          };
        });
        return updated.toSorted((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderEntities("unit", updates, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to reorder units", {
            duration: TOAST_DURATIONS.ERROR,
          });
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reorder units";
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

  // Fetch units when encryption is unlocked
  useEffect(() => {
    if (!isUnlocked || !masterKey) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptUnitRows(options.initialEncryptedData, masterKey)
        .then((decrypted) => setUnits(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt units";
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

/** Options for useUnit hook. */
interface UseUnitOptions {
  /** Server-prefetched encrypted row. Skips the initial fetch when provided. */
  initialEncryptedData?: UnitRow;
}

/**
 * Hook to manage a single Unit by ID
 */
export function useUnit(id: string, options?: UseUnitOptions): UseUnitReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  /**
   * Fetch and decrypt the unit
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setUnit(null);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUnit(id);
      if (!result.success) {
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        if (
          triggerHardLogoutForError(result.error, {
            redirectUri: routeAtStart,
            expectedRoute: routeAtStart,
            requestStartedAt,
          })
        ) {
          return;
        }
        const msg = result.error ?? "Failed to fetch unit";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setUnit(null);
        return;
      }

      // Decrypt the unit client-side
      const decrypted = await decryptUnitRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setUnit(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch unit";
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      if (
        triggerHardLogoutForError(msg, {
          redirectUri: routeAtStart,
          expectedRoute: routeAtStart,
          requestStartedAt,
        })
      ) {
        return;
      }
      setError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setUnit(null);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, masterKey, isUnlocked]);

  /**
   * Update the unit
   */
  const update = useCallback(
    async (input: Partial<UnitInput>): Promise<boolean> => {
      if (!masterKey || !id) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-units");
        return false;
      }

      try {
        const encrypted = await encryptUnitUpdate(id, input, masterKey);
        const result = await updateUnit({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update unit", {
            duration: TOAST_DURATIONS.ERROR,
          });
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
        const message =
          err instanceof Error ? err.message : "Failed to update unit";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
      toast.error("Invalid or missing ID", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return false;
    }

    try {
      const result = await deleteUnit(id, csrfToken);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete unit", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }

      setUnit(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete unit";
      if (triggerHardLogoutForError(message)) {
        return false;
      }
      toast.error(message, { duration: TOAST_DURATIONS.ERROR });
      return false;
    }
  }, [id, csrfToken]);

  // Fetch unit when encryption is unlocked
  useEffect(() => {
    if (!isUnlocked || !masterKey || !id) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptUnitRow(options.initialEncryptedData, masterKey)
        .then((decrypted) => setUnit(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt unit";
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
    unit,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
