"use client";

import { useMemo } from "react";

import {
  isDefaultLabelConfigId,
  getDefaultLabels,
} from "@/lib/config/default-labels";

import type { Label } from "@/lib/types";

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
 * Hook to read fixed labels for a default config.
 */
export function useLabels(configId: string | null): UseLabelsReturn {
  const isDefault = configId ? isDefaultLabelConfigId(configId) : false;
  const labels = useMemo(() => {
    if (!configId || !isDefaultLabelConfigId(configId)) return [];
    return convertDefaultLabelsToLabels(configId, getDefaultLabels(configId));
  }, [configId]);

  return {
    labels,
    isLoading: false,
    error: null,
    isDefaultConfig: isDefault,
  };
}
