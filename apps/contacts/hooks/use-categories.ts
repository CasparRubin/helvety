"use client";

import { useMemo } from "react";

import {
  isDefaultConfigId,
  getDefaultCategories,
} from "@/lib/config/default-categories";

import type { Category } from "@/lib/types";

/**
 * Return type for useCategories hook
 */
interface UseCategoriesReturn {
  /** List of decrypted categories */
  categories: Category[];
  /** Whether categories are being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether this is a default (read-only) config */
  isDefaultConfig: boolean;
}

/**
 * Convert default categories to Category format with placeholder user fields
 */
function convertDefaultCategoriesToCategories(
  configId: string,
  defaultCategories: ReturnType<typeof getDefaultCategories>
): Category[] {
  if (!defaultCategories) return [];
  return defaultCategories.map((dc) => ({
    id: dc.id,
    config_id: configId,
    user_id: "default",
    name: dc.name,
    color: dc.color,
    icon: dc.icon,
    sort_order: dc.sort_order,
    default_rows_shown: dc.default_rows_shown,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Hook to read fixed categories for a default config.
 */
export function useCategories(configId: string | null): UseCategoriesReturn {
  const isDefault = configId ? isDefaultConfigId(configId) : false;
  const categories = useMemo(() => {
    if (!configId || !isDefaultConfigId(configId)) return [];
    return convertDefaultCategoriesToCategories(
      configId,
      getDefaultCategories(configId)
    );
  }, [configId]);

  return {
    categories,
    isLoading: false,
    error: null,
    isDefaultConfig: isDefault,
  };
}
