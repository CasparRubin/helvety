"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import {
  getCategoryConfigs,
  createCategoryConfig,
  updateCategoryConfig,
  deleteCategoryConfig,
} from "@/app/actions/category-actions";
import {
  DEFAULT_CATEGORY_CONFIG,
  isDefaultConfigId,
} from "@/lib/config/default-categories";
import {
  useEncryptionContext,
  encryptCategoryConfigInput,
  encryptCategoryConfigUpdate,
  decryptCategoryConfigRows,
} from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { CategoryConfig, CategoryConfigInput } from "@/lib/types";

/**
 * Return type for useCategoryConfigs hook
 */
interface UseCategoryConfigsReturn {
  /** List of decrypted category configs (includes default) */
  configs: CategoryConfig[];
  /** Whether configs are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh configs from server */
  refresh: () => Promise<void>;
  /** Create a new category config */
  create: (input: CategoryConfigInput) => Promise<{ id: string } | null>;
  /** Update a category config */
  update: (id: string, input: Partial<CategoryConfigInput>) => Promise<boolean>;
  /** Delete a category config */
  remove: (id: string) => Promise<boolean>;
}

/**
 * Convert the default config to CategoryConfig format
 */
function getDefaultConfigAsCategoryConfig(): CategoryConfig {
  return {
    id: DEFAULT_CATEGORY_CONFIG.id,
    user_id: "default",
    name: DEFAULT_CATEGORY_CONFIG.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isDefault: true,
  };
}

/**
 * Hook to manage CategoryConfigs with automatic encryption/decryption
 */
export function useCategoryConfigs(): UseCategoryConfigsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [userConfigs, setUserConfigs] = useState<CategoryConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the default config
  const defaultConfig = useMemo(() => getDefaultConfigAsCategoryConfig(), []);

  // Combine default config with user configs
  const configs = useMemo(() => {
    const result: CategoryConfig[] = [defaultConfig];
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
      const result = await getCategoryConfigs();
      if (!result.success) {
        setError(result.error);
        setUserConfigs([]);
        return;
      }

      const decrypted = await decryptCategoryConfigRows(result.data, masterKey);
      setUserConfigs(decrypted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch category configs"
      );
      setUserConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  const create = useCallback(
    async (input: CategoryConfigInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
        return null;
      }

      try {
        const encrypted = await encryptCategoryConfigInput(input, masterKey);
        const result = await createCategoryConfig(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create category config"
        );
        return null;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<CategoryConfigInput>
    ): Promise<boolean> => {
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
        const encrypted = await encryptCategoryConfigUpdate(
          id,
          input,
          masterKey
        );
        const result = await updateCategoryConfig(
          { id, ...encrypted },
          csrfToken
        );
        if (!result.success) {
          setError(result.error ?? "Failed to update category config");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update category config"
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
        const result = await deleteCategoryConfig(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete category config");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete category config"
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
