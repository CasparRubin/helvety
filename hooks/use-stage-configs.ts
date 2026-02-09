"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import {
  getStageConfigs,
  createStageConfig,
  updateStageConfig,
  deleteStageConfig,
} from "@/app/actions/stage-actions";
import {
  DEFAULT_STAGE_CONFIGS,
  isDefaultConfigId,
} from "@/lib/config/default-stages";
import {
  useEncryptionContext,
  encryptStageConfigInput,
  encryptStageConfigUpdate,
  decryptStageConfigRows,
} from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { StageConfig, StageConfigInput, EntityType } from "@/lib/types";

/**
 * Return type for useStageConfigs hook
 */
interface UseStageConfigsReturn {
  /** List of decrypted stage configs (includes default for entity type) */
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
 * Convert a default config to StageConfig format
 */
function getDefaultConfigAsStageConfig(entityType: EntityType): StageConfig {
  const defaultConfig = DEFAULT_STAGE_CONFIGS[entityType];
  return {
    id: defaultConfig.id,
    user_id: "default",
    name: defaultConfig.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isDefault: true,
  };
}

/**
 * Hook to manage StageConfigs with automatic encryption/decryption
 * @param entityType - The entity type to get the relevant default config for
 */
export function useStageConfigs(
  entityType?: EntityType
): UseStageConfigsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [userConfigs, setUserConfigs] = useState<StageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the default config for the entity type
  const defaultConfig = useMemo(() => {
    return entityType ? getDefaultConfigAsStageConfig(entityType) : null;
  }, [entityType]);

  // Combine default config with user configs
  const configs = useMemo(() => {
    const result: StageConfig[] = [];
    if (defaultConfig) {
      result.push(defaultConfig);
    }
    result.push(...userConfigs);
    return result;
  }, [defaultConfig, userConfigs]);

  const refresh = useCallback(async () => {
    if (!masterKey || !isUnlocked) {
      setUserConfigs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getStageConfigs();
      if (!result.success) {
        setError(result.error);
        setUserConfigs([]);
        return;
      }

      const decrypted = await decryptStageConfigRows(result.data, masterKey);
      setUserConfigs(decrypted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch stage configs"
      );
      setUserConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  const create = useCallback(
    async (input: StageConfigInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
        return null;
      }

      try {
        const encrypted = await encryptStageConfigInput(input, masterKey);
        const result = await createStageConfig(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
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
      // Prevent modifications on default configs
      if (isDefaultConfigId(id)) {
        setError("Cannot modify default configuration");
        return false;
      }

      if (!masterKey) {
        setError("Encryption not unlocked");
        return false;
      }
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
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
      // Prevent modifications on default configs
      if (isDefaultConfigId(id)) {
        setError("Cannot delete default configuration");
        return false;
      }

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
