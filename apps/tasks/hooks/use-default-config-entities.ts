"use client";

import { useMemo } from "react";

import {
  isDefaultLabelConfigId,
  getDefaultLabels,
} from "@/lib/config/default-labels";
import {
  isDefaultConfigId,
  getDefaultStages,
} from "@/lib/config/default-stages";

import type { Label, Stage } from "@/lib/types";

/**
 *
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
 *
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

/** Hook to read fixed stages for a default config. */
export function useStages(configId: string | null): {
  stages: Stage[];
  isLoading: boolean;
  error: string | null;
  isDefaultConfig: boolean;
} {
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

/** Hook to read fixed labels for a default config. */
export function useLabels(configId: string | null): {
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  isDefaultConfig: boolean;
} {
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
