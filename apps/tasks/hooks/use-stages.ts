"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect } from "react";

import {
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from "@/app/actions/stage-actions";
import {
  isDefaultConfigId,
  getDefaultStages,
} from "@/lib/config/default-stages";
import {
  useEncryptionContext,
  encryptStageInput,
  encryptStageUpdate,
  decryptStageRows,
} from "@/lib/crypto";

import type { Stage, StageInput } from "@/lib/types";

/**
 * Return type for useStages hook
 */
interface UseStagesReturn {
  /** List of decrypted stages */
  stages: Stage[];
  /** Whether stages are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether this is a default (read-only) config */
  isDefaultConfig: boolean;
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
 * Convert default stages to Stage format with placeholder user fields
 */
function convertDefaultStagesToStages(
  configId: string,
  defaultStages: ReturnType<typeof getDefaultStages>
): Stage[] {
  if (!defaultStages) return [];
  return defaultStages.map((ds) => ({
    id: ds.id,
    config_id: configId,
    user_id: "default",
    name: ds.name,
    color: ds.color,
    icon: ds.icon,
    sort_order: ds.sort_order,
    default_rows_shown: ds.default_rows_shown,
    created_at: new Date().toISOString(),
  }));
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

  // Check if this is a default config (read-only)
  const isDefault = configId ? isDefaultConfigId(configId) : false;

  const refresh = useCallback(async () => {
    if (!configId) {
      setStages([]);
      setIsLoading(false);
      return;
    }

    // Handle default configs - return hardcoded stages directly
    if (isDefaultConfigId(configId)) {
      const defaultStages = getDefaultStages(configId);
      setStages(convertDefaultStagesToStages(configId, defaultStages));
      setIsLoading(false);
      setError(null);
      return;
    }

    // User configs require encryption to be unlocked
    if (!masterKey || !isUnlocked) {
      setStages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getStages(configId);
      if (!result.success) {
        setError(result.error);
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
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
        return null;
      }

      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        const encrypted = await encryptStageInput(input, masterKey);
        const result = await createStage(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create stage");
        return null;
      }
    },
    [masterKey, csrfToken, refresh, isDefault]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<StageInput, "config_id">>
    ): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
        return false;
      }

      if (!masterKey) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptStageUpdate(id, input, masterKey);
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
    [masterKey, csrfToken, refresh, isDefault]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
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
    [csrfToken, refresh, isDefault]
  );

  const reorder = useCallback(
    async (updates: { id: string; sort_order: number }[]): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
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
    [csrfToken, refresh, isDefault]
  );

  useEffect(() => {
    if (!configId) {
      setStages([]);
      setIsLoading(false);
      return;
    }
    if (isUnlocked && masterKey) {
      void refresh();
    }
  }, [isUnlocked, masterKey, configId, refresh]);

  return {
    stages,
    isLoading,
    error,
    isDefaultConfig: isDefault,
    refresh,
    create,
    update,
    remove,
    reorder,
  };
}
