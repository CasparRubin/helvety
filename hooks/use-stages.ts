"use client";

import { useState, useCallback, useEffect } from "react";

import {
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from "@/app/actions/stage-actions";
import {
  useEncryptionContext,
  encryptStageInput,
  encryptStageUpdate,
  decryptStageRows,
} from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { Stage, StageInput } from "@/lib/types";

/**
 *
 */
interface UseStagesReturn {
  /** List of decrypted stages */
  stages: Stage[];
  /** Whether stages are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh stages from server */
  refresh: () => Promise<void>;
  /** Create a new stage */
  create: (input: StageInput) => Promise<{ id: string } | null>;
  /** Update a stage */
  update: (
    id: string,
    input: Partial<Omit<StageInput, "config_id">>
  ) => Promise<boolean>;
  /** Delete a stage */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder stages */
  reorder: (updates: { id: string; sort_order: number }[]) => Promise<boolean>;
}

/**
 * Hook to manage Stages within a specific StageConfig
 */
export function useStages(configId: string | null): UseStagesReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked || !configId) {
      setStages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getStages(configId);
      if (!result.success || !result.data) {
        setError(result.error ?? "Failed to fetch stages");
        setStages([]);
        return;
      }

      const decrypted = await decryptStageRows(result.data, masterKey);
      setStages(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stages");
      setStages([]);
    } finally {
      setIsLoading(false);
    }
  }, [configId, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: StageInput): Promise<{ id: string } | null> => {
      if (!masterKey || !csrfToken) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        const encrypted = await encryptStageInput(input, masterKey);
        const result = await createStage(encrypted, csrfToken);
        if (!result.success || !result.data) {
          setError(result.error ?? "Failed to create stage");
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create stage");
        return null;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<StageInput, "config_id">>
    ): Promise<boolean> => {
      if (!masterKey || !csrfToken) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptStageUpdate(input, masterKey);
        const result = await updateStage({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update stage");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update stage");
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
        const result = await deleteStage(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete stage");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete stage");
        return false;
      }
    },
    [csrfToken, refresh]
  );

  const reorder = useCallback(
    async (updates: { id: string; sort_order: number }[]): Promise<boolean> => {
      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      try {
        const result = await reorderStages(updates, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to reorder stages");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder stages"
        );
        return false;
      }
    },
    [csrfToken, refresh]
  );

  useEffect(() => {
    if (isUnlocked && masterKey && configId) {
      void refresh();
    }
  }, [isUnlocked, masterKey, configId, refresh]);

  return {
    stages,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}
