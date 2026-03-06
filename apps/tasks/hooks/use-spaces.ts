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

import type { Space, SpaceInput, SpaceRow, ReorderUpdate } from "@/lib/types";

/** Options for useSpaces hook */
interface UseSpacesOptions {
  /** Server-prefetched encrypted rows. Skips the initial fetch when provided. */
  initialEncryptedData?: SpaceRow[];
}

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
    "tasks-use-spaces",
    {
      expectedRoute: options?.expectedRoute,
      requestStartedAt: options?.requestStartedAt,
    }
  );
}

/**
 * Hook to manage Spaces for a specific Unit with automatic encryption/decryption
 */
export function useSpaces(
  unitId: string,
  options?: UseSpacesOptions
): UseSpacesReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  /**
   * Fetch and decrypt all spaces for the unit
   */
  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !unitId) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSpaces(unitId);
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
        const msg = result.error ?? "Failed to fetch spaces";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setSpaces([]);
        return;
      }

      // Decrypt all spaces client-side
      const decrypted = await decryptSpaceRows(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setSpaces(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch spaces";
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
      setSpaces([]);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [unitId, masterKey, isUnlocked]);

  /**
   * Create a new space
   */
  const create = useCallback(
    async (input: SpaceInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-spaces");
        return null;
      }

      try {
        // Encrypt the input client-side
        const encrypted = await encryptSpaceInput(input, masterKey);

        // Send encrypted data to server
        const result = await createSpace(encrypted, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return null;
          }
          toast.error(result.error ?? "Failed to create space", {
            duration: TOAST_DURATIONS.ERROR,
          });
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
          return [...prev, newSpace].toSorted(
            (a, b) => a.sort_order - b.sort_order
          );
        });

        return result.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create space";
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
   * Update a space
   */
  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<SpaceInput, "unit_id">>
    ): Promise<boolean> => {
      if (!masterKey) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-spaces");
        return false;
      }

      try {
        // Encrypt the update fields
        const encrypted = await encryptSpaceUpdate(id, input, masterKey);

        // Send encrypted data to server
        const result = await updateSpace({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update space", {
            duration: TOAST_DURATIONS.ERROR,
          });
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
        const message =
          err instanceof Error ? err.message : "Failed to update space";
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
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          setSpaces(prevSpaces);
          toast.error(result.error ?? "Failed to delete space", {
            duration: TOAST_DURATIONS.ERROR,
          });
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete space";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        setSpaces(prevSpaces);
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
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
        const updatesById = new Map(updates.map((u) => [u.id, u]));
        const updated = prev.map((space) => {
          const match = updatesById.get(space.id);
          if (!match) return space;
          return {
            ...space,
            sort_order: match.sort_order,
            stage_id:
              match.stage_id !== undefined ? match.stage_id : space.stage_id,
          };
        });
        return updated.toSorted((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderEntities(
          "space",
          updates,
          csrfToken,
          unitId
        );
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to reorder spaces", {
            duration: TOAST_DURATIONS.ERROR,
          });
          await refresh();
          return false;
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reorder spaces";
        if (triggerHardLogoutForError(message)) {
          return false;
        }
        toast.error(message, { duration: TOAST_DURATIONS.ERROR });
        await refresh();
        return false;
      }
    },
    [csrfToken, refresh, unitId]
  );

  // Fetch spaces when encryption is unlocked
  useEffect(() => {
    if (!isUnlocked || !masterKey || !unitId) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptSpaceRows(options.initialEncryptedData, masterKey)
        .then((decrypted) => setSpaces(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt spaces";
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
    unitId,
    refresh,
    options?.initialEncryptedData,
    initialDataConsumed,
  ]);

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

/** Options for useSpace hook. */
interface UseSpaceOptions {
  /** Server-prefetched encrypted row. Skips the initial fetch when provided. */
  initialEncryptedData?: SpaceRow;
}

/**
 * Hook to manage a single Space by ID
 */
export function useSpace(
  id: string,
  options?: UseSpaceOptions
): UseSpaceReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [space, setSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);
  const latestRefreshTokenRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !id) {
      setSpace(null);
      setIsLoading(false);
      return;
    }

    const refreshToken = ++latestRefreshTokenRef.current;
    const routeAtStart = window.location.href;
    const requestStartedAt = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSpace(id);
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
        const msg = result.error ?? "Failed to fetch space";
        if (refreshToken !== latestRefreshTokenRef.current) {
          return;
        }
        setError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setSpace(null);
        return;
      }

      const decrypted = await decryptSpaceRow(result.data, masterKey);
      if (refreshToken !== latestRefreshTokenRef.current) {
        return;
      }
      setSpace(decrypted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch space";
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
      setSpace(null);
    } finally {
      if (refreshToken === latestRefreshTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, masterKey, isUnlocked]);

  const update = useCallback(
    async (input: Partial<Omit<SpaceInput, "unit_id">>): Promise<boolean> => {
      if (!masterKey || !id) {
        triggerHardLogoutOnce(window.location.href, "tasks-use-spaces");
        return false;
      }

      try {
        const encrypted = await encryptSpaceUpdate(id, input, masterKey);
        const result = await updateSpace({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          if (triggerHardLogoutForError(result.error)) {
            return false;
          }
          toast.error(result.error ?? "Failed to update space", {
            duration: TOAST_DURATIONS.ERROR,
          });
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
        const message =
          err instanceof Error ? err.message : "Failed to update space";
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
      toast.error("Invalid or missing ID", {
        duration: TOAST_DURATIONS.ERROR,
      });
      return false;
    }

    try {
      const result = await deleteSpace(id, csrfToken);
      if (!result.success) {
        if (triggerHardLogoutForError(result.error)) {
          return false;
        }
        toast.error(result.error ?? "Failed to delete space", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return false;
      }

      setSpace(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete space";
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
      decryptSpaceRow(options.initialEncryptedData, masterKey)
        .then((decrypted) => setSpace(decrypted))
        .catch((err) => {
          const msg =
            err instanceof Error ? err.message : "Failed to decrypt space";
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
    space,
    isLoading,
    error,
    refresh,
    update,
    remove,
  };
}
