"use client";

import { useState, useCallback, useEffect } from "react";

import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  reorderLabels,
} from "@/app/actions/label-actions";
import {
  isDefaultLabelConfigId,
  getDefaultLabels,
} from "@/lib/config/default-labels";
import {
  useEncryptionContext,
  encryptLabelInput,
  encryptLabelUpdate,
  decryptLabelRows,
} from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { Label, LabelInput } from "@/lib/types";

/**
 * Return type for useLabels hook
 */
interface UseLabelsReturn {
  /** List of decrypted labels */
  labels: Label[];
  /** Whether labels are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether this is a default (read-only) config */
  isDefaultConfig: boolean;
  /** Refresh labels from server */
  refresh: () => Promise<void>;
  /** Create a new label */
  create: (input: LabelInput) => Promise<{ id: string } | null>;
  /** Update a label */
  update: (
    id: string,
    input: Partial<Omit<LabelInput, "config_id">>
  ) => Promise<boolean>;
  /** Delete a label */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder labels */
  reorder: (updates: { id: string; sort_order: number }[]) => Promise<boolean>;
}

/**
 * Convert default labels to Label format with placeholder user fields
 */
function convertDefaultLabelsToLabels(
  configId: string,
  defaultLabels: ReturnType<typeof getDefaultLabels>
): Label[] {
  if (!defaultLabels) return [];
  return defaultLabels.map((dl) => ({
    id: dl.id,
    config_id: configId,
    user_id: "default",
    name: dl.name,
    color: dl.color,
    icon: dl.icon,
    sort_order: dl.sort_order,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Hook to manage Labels within a specific LabelConfig
 */
export function useLabels(configId: string | null): UseLabelsReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if this is a default config (read-only)
  const isDefault = configId ? isDefaultLabelConfigId(configId) : false;

  const refresh = useCallback(async () => {
    if (!configId) {
      setLabels([]);
      setIsLoading(false);
      return;
    }

    // Handle default configs - return hardcoded labels directly
    if (isDefaultLabelConfigId(configId)) {
      const defaultLabels = getDefaultLabels(configId);
      setLabels(convertDefaultLabelsToLabels(configId, defaultLabels));
      setIsLoading(false);
      setError(null);
      return;
    }

    // User configs require encryption to be unlocked
    if (!masterKey || !isUnlocked) {
      setLabels([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getLabels(configId);
      if (!result.success) {
        setError(result.error);
        setLabels([]);
        return;
      }

      const decrypted = await decryptLabelRows(result.data, masterKey);
      setLabels(decrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch labels");
      setLabels([]);
    } finally {
      setIsLoading(false);
    }
  }, [configId, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: LabelInput): Promise<{ id: string } | null> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
        return null;
      }

      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
        return null;
      }

      try {
        const encrypted = await encryptLabelInput(input, masterKey);
        const result = await createLabel(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }

        await refresh();
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create label");
        return null;
      }
    },
    [masterKey, csrfToken, refresh, isDefault]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<LabelInput, "config_id">>
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
      if (!csrfToken) {
        setError("Please wait, initializing security token...");
        return false;
      }

      try {
        const encrypted = await encryptLabelUpdate(input, masterKey);
        const result = await updateLabel({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update label");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update label");
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

      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      try {
        const result = await deleteLabel(id, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to delete label");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete label");
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

      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      try {
        const result = await reorderLabels(updates, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to reorder labels");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder labels"
        );
        return false;
      }
    },
    [csrfToken, refresh, isDefault]
  );

  useEffect(() => {
    if (!configId) {
      setLabels([]);
      setIsLoading(false);
      return;
    }
    if (isUnlocked && masterKey) {
      void refresh();
    }
  }, [isUnlocked, masterKey, configId, refresh]);

  return {
    labels,
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
