"use client";

import { useState, useCallback, useEffect } from "react";

import {
  getStageConfigs,
  createStageConfig,
  updateStageConfig,
  deleteStageConfig,
} from "@/app/actions/stage-actions";
import {
  useEncryptionContext,
  encryptStageConfigInput,
  encryptStageConfigUpdate,
  decryptStageConfigRows,
} from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { StageConfig, StageConfigInput } from "@/lib/types";

/**
 *
 */
interface UseStageConfigsReturn {
  /** List of decrypted stage configs */
  configs: StageConfig[];
  /** Whether configs are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh configs from server */
  refresh: () => Promise<void>;
  /** Create a new stage config */
  create: (input: StageConfigInput) => Promise<{ id: string } | null>;
  /** Update a stage config */
  update: (id: string, input: Partial<StageConfigInput>) => Promise<boolean>;
  /** Delete a stage config */
  remove: (id: string) => Promise<boolean>;
}

/**
 * Hook to manage StageConfigs with automatic encryption/decryption
 */
export function useStageConfigs(): UseStageConfigsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [configs, setConfigs] = useState<StageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setConfigs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getStageConfigs();
      if (!result.success || !result.data) {
        setError(result.error ?? "Failed to fetch stage configs");
        setConfigs([]);
        return;
      }

      const decrypted = await decryptStageConfigRows(result.data, masterKey);
      setConfigs(decrypted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch stage configs"
      );
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  const create = useCallback(
    async (input: StageConfigInput): Promise<{ id: string } | null> => {
      if (!masterKey || !csrfToken) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        const encrypted = await encryptStageConfigInput(input, masterKey);
        const result = await createStageConfig(encrypted, csrfToken);
        if (!result.success || !result.data) {
          setError(result.error ?? "Failed to create stage config");
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create stage config"
        );
        return null;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const update = useCallback(
    async (id: string, input: Partial<StageConfigInput>): Promise<boolean> => {
      if (!masterKey || !csrfToken) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptStageConfigUpdate(input, masterKey);
        const result = await updateStageConfig({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update stage config");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update stage config"
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
        const result = await deleteStageConfig(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete stage config");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete stage config"
        );
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
    configs,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
