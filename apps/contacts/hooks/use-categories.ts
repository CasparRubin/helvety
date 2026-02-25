"use client";

import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { useState, useCallback, useEffect } from "react";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/app/actions/category-actions";
import {
  isDefaultConfigId,
  getDefaultCategories,
} from "@/lib/config/default-categories";
import {
  useEncryptionContext,
  encryptCategoryInput,
  encryptCategoryUpdate,
  decryptCategoryRows,
} from "@/lib/crypto";

import type { Category, CategoryInput } from "@/lib/types";

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
  /** Refresh categories from server */
  refresh: () => Promise<void>;
  /** Create a new category */
  create: (input: CategoryInput) => Promise<{ id: string } | null>;
  /** Update a category */
  update: (
    id: string,
    input: Partial<Omit<CategoryInput, "config_id">>
  ) => Promise<boolean>;
  /** Delete a category */
  remove: (id: string) => Promise<boolean>;
  /** Batch reorder categories */
  reorder: (updates: { id: string; sort_order: number }[]) => Promise<boolean>;
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
 * Hook to manage Categories within a specific CategoryConfig
 */
export function useCategories(configId: string | null): UseCategoriesReturn {
  const { masterKey, isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if this is a default config (read-only)
  const isDefault = configId ? isDefaultConfigId(configId) : false;

  const refresh = useCallback(async () => {
    if (!configId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    // Handle default configs - return hardcoded categories directly
    if (isDefaultConfigId(configId)) {
      const defaultCategories = getDefaultCategories(configId);
      setCategories(
        convertDefaultCategoriesToCategories(configId, defaultCategories)
      );
      setIsLoading(false);
      setError(null);
      return;
    }

    // User configs require encryption to be unlocked
    if (!masterKey || !isUnlocked) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCategories(configId);
      if (!result.success) {
        setError(result.error);
        setCategories([]);
        return;
      }

      const decrypted = await decryptCategoryRows(result.data, masterKey);
      setCategories(decrypted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [configId, masterKey, isUnlocked]);

  const create = useCallback(
    async (input: CategoryInput): Promise<{ id: string } | null> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
        return null;
      }

      if (!masterKey) {
        setError("Encryption not unlocked");
        return null;
      }

      try {
        const encrypted = await encryptCategoryInput(input, masterKey);
        const result = await createCategory(encrypted, csrfToken);
        if (!result.success) {
          setError(result.error);
          return null;
        }
        setCategories((prev) => {
          const maxSortOrder =
            prev.length > 0 ? Math.max(...prev.map((c) => c.sort_order)) : -1;
          const createdAt = new Date().toISOString();
          return [
            ...prev,
            {
              id: result.data.id,
              config_id: input.config_id,
              user_id: prev[0]?.user_id ?? "",
              name: input.name,
              color: input.color ?? null,
              icon: input.icon ?? "circle",
              sort_order: input.sort_order ?? maxSortOrder + 1,
              default_rows_shown: input.default_rows_shown ?? 20,
              created_at: createdAt,
            },
          ].toSorted((a, b) => a.sort_order - b.sort_order);
        });
        return result.data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create category"
        );
        return null;
      }
    },
    [masterKey, csrfToken, isDefault]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<CategoryInput, "config_id">>
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

      try {
        const encrypted = await encryptCategoryUpdate(id, input, masterKey);
        const result = await updateCategory({ id, ...encrypted }, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to update category");
          return false;
        }
        setCategories((prev) =>
          prev.map((category) => {
            if (category.id !== id) return category;
            return {
              ...category,
              ...(input.name !== undefined && { name: input.name }),
              ...(input.color !== undefined && { color: input.color ?? null }),
              ...(input.icon !== undefined && { icon: input.icon }),
              ...(input.sort_order !== undefined && {
                sort_order: input.sort_order,
              }),
              ...(input.default_rows_shown !== undefined && {
                default_rows_shown: input.default_rows_shown,
              }),
            };
          })
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update category"
        );
        return false;
      }
    },
    [masterKey, csrfToken, isDefault]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
        return false;
      }

      let prevCategories: Category[] = [];
      setCategories((prev) => {
        prevCategories = prev;
        return prev.filter((category) => category.id !== id);
      });

      try {
        const result = await deleteCategory(id, csrfToken);
        if (!result.success) {
          setCategories(prevCategories);
          setError(result.error ?? "Failed to delete category");
          return false;
        }
        return true;
      } catch (err) {
        setCategories(prevCategories);
        setError(
          err instanceof Error ? err.message : "Failed to delete category"
        );
        return false;
      }
    },
    [csrfToken, isDefault]
  );

  const reorder = useCallback(
    async (updates: { id: string; sort_order: number }[]): Promise<boolean> => {
      // Prevent modifications on default configs
      if (isDefault) {
        setError("Cannot modify default configuration");
        return false;
      }

      let prevCategories: Category[] = [];
      setCategories((prev) => {
        prevCategories = prev;
        const updatesById = new Map(updates.map((u) => [u.id, u.sort_order]));
        return prev
          .map((category) => {
            const nextSortOrder = updatesById.get(category.id);
            if (nextSortOrder === undefined) return category;
            return { ...category, sort_order: nextSortOrder };
          })
          .toSorted((a, b) => a.sort_order - b.sort_order);
      });

      try {
        const result = await reorderCategories(updates, csrfToken);
        if (!result.success) {
          setCategories(prevCategories);
          setError(result.error ?? "Failed to reorder categories");
          return false;
        }
        return true;
      } catch (err) {
        setCategories(prevCategories);
        setError(
          err instanceof Error ? err.message : "Failed to reorder categories"
        );
        return false;
      }
    },
    [csrfToken, isDefault]
  );

  useEffect(() => {
    if (!configId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }
    if (isUnlocked && masterKey) {
      void refresh();
    }
  }, [isUnlocked, masterKey, configId, refresh]);

  return {
    categories,
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
