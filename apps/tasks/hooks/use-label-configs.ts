"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect, useMemo } from "react";

import {
  getLabelConfigs,
  createLabelConfig,
  updateLabelConfig,
  deleteLabelConfig,
} from "@/app/actions/label-actions";
import {
  DEFAULT_LABEL_CONFIG,
  isDefaultLabelConfigId,
} from "@/lib/config/default-labels";
import {
  useEncryptionContext,
  encryptLabelConfigInput,
  encryptLabelConfigUpdate,
  decryptLabelConfigRows,
} from "@/lib/crypto";

import type {
  LabelConfig,
  LabelConfigInput,
  LabelConfigRow,
} from "@/lib/types";

/** Options for useLabelConfigs hook */
interface UseLabelConfigsOptions {
  /** Server-prefetched encrypted rows. Skips the initial fetch when provided. */
  initialEncryptedData?: LabelConfigRow[];
}

/**
 * Return type for useLabelConfigs hook
 */
interface UseLabelConfigsReturn {
  /** List of decrypted label configs (includes default) */
  configs: LabelConfig[];
  /** Whether configs are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh configs from server */
  refresh: () => Promise<void>;
  /** Create a new label config */
  create: (input: LabelConfigInput) => Promise<{ id: string } | null>;
  /** Update a label config */
  update: (id: string, input: Partial<LabelConfigInput>) => Promise<boolean>;
  /** Delete a label config */
  remove: (id: string) => Promise<boolean>;
}

/**
 * Convert the default label config to LabelConfig format
 */
function getDefaultConfigAsLabelConfig(): LabelConfig {
  return {
    id: DEFAULT_LABEL_CONFIG.id,
    user_id: "default",
    name: DEFAULT_LABEL_CONFIG.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isDefault: true,
  };
}

/**
 * Hook to manage LabelConfigs with automatic encryption/decryption
 */
export function useLabelConfigs(
  options?: UseLabelConfigsOptions
): UseLabelConfigsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [userConfigs, setUserConfigs] = useState<LabelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);

  // Get the default config
  const defaultConfig = useMemo(() => getDefaultConfigAsLabelConfig(), []);

  // Combine default config with user configs
  const configs = useMemo(() => {
    return [defaultConfig, ...userConfigs];
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
      const result = await getLabelConfigs();
      if (!result.success) {
        setError(result.error);
        setUserConfigs([]);
        return;
      }

      const decrypted = await decryptLabelConfigRows(result.data, masterKey);
      setUserConfigs(decrypted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch label configs"
      );
      setUserConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterKey, isUnlocked]);

  const create = useCallback(
    async (input: LabelConfigInput): Promise<{ id: string } | null> => {
      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        const encrypted = await encryptLabelConfigInput(input, masterKey);
        const result = await createLabelConfig(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }
        const now = new Date().toISOString();
        setUserConfigs((prev) => [
          ...prev,
          {
            id: result.data.id,
            user_id: prev[0]?.user_id ?? "",
            name: input.name,
            created_at: now,
            updated_at: now,
          },
        ]);
        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create label config"
        );
        return null;
      }
    },
    [masterKey, csrfToken]
  );

  const update = useCallback(
    async (id: string, input: Partial<LabelConfigInput>): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefaultLabelConfigId(id)) {
        setError("Cannot modify default configuration");
        return false;
      }

      if (!masterKey) {
        setError("Encryption not unlocked");
        return false;
      }

      try {
        const encrypted = await encryptLabelConfigUpdate(id, input, masterKey);
        const result = await updateLabelConfig({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update label config");
          return false;
        }
        setUserConfigs((prev) =>
          prev.map((config) => {
            if (config.id !== id) return config;
            return {
              ...config,
              ...(input.name !== undefined && { name: input.name }),
              updated_at: new Date().toISOString(),
            };
          })
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update label config"
        );
        return false;
      }
    },
    [masterKey, csrfToken]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefaultLabelConfigId(id)) {
        setError("Cannot delete default configuration");
        return false;
      }

      let prevConfigs: LabelConfig[] = [];
      setUserConfigs((prev) => {
        prevConfigs = prev;
        return prev.filter((config) => config.id !== id);
      });

      try {
        const result = await deleteLabelConfig(id, csrfToken);
        if (!result.success) {
          setUserConfigs(prevConfigs);
          setError(result.error ?? "Failed to delete label config");
          return false;
        }
        return true;
      } catch (err) {
        setUserConfigs(prevConfigs);
        setError(
          err instanceof Error ? err.message : "Failed to delete label config"
        );
        return false;
      }
    },
    [csrfToken]
  );

  useEffect(() => {
    if (!isUnlocked || !masterKey) return;

    if (options?.initialEncryptedData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      setIsLoading(true);
      setError(null);
      decryptLabelConfigRows(options.initialEncryptedData, masterKey)
        .then((decrypted) => setUserConfigs(decrypted))
        .catch((err) =>
          setError(
            err instanceof Error
              ? err.message
              : "Failed to decrypt label configs"
          )
        )
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
    configs,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}
