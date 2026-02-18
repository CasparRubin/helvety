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

import type { LabelConfig, LabelConfigInput } from "@/lib/types";

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
export function useLabelConfigs(): UseLabelConfigsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [userConfigs, setUserConfigs] = useState<LabelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        await refresh();
        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create label config"
        );
        return null;
      }
    },
    [masterKey, csrfToken, refresh]
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

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update label config"
        );
        return false;
      }
    },
    [masterKey, csrfToken, refresh]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefaultLabelConfigId(id)) {
        setError("Cannot delete default configuration");
        return false;
      }

      try {
        const result = await deleteLabelConfig(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete label config");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete label config"
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
