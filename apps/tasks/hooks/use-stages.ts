"use client";

import { useMemo } from "react";

import {
  isDefaultConfigId,
  getDefaultStages,
} from "@/lib/config/default-stages";

import type { Stage } from "@/lib/types";

/**
 * Return type for useStages hook
 */
interface UseStagesReturn {
  /** List of default stages mapped to Stage records */
  stages: Stage[];
  /** Always false for default in-memory config */
  isLoading: boolean;
  /** Always null for default in-memory config */
  error: string | null;
  /** Whether this is a default (read-only) config */
  isDefaultConfig: boolean;
}

/**
 * Convert default stages to Stage records with placeholder user fields
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
 * Hook to read fixed stages for a default config.
 */
export function useStages(configId: string | null): UseStagesReturn {
  const isDefault = configId ? isDefaultConfigId(configId) : false;
  const stages = useMemo(() => {
    if (!configId || !isDefaultConfigId(configId)) return [];
    return convertDefaultStagesToStages(configId, getDefaultStages(configId));
  }, [configId]);

  return {
    stages,
    isLoading: false,
    error: null,
    isDefaultConfig: isDefault,
  };
}
