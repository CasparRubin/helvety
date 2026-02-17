"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import {
  getCategoryAssignment,
  setCategoryAssignment,
  removeCategoryAssignment,
} from "@/app/actions/category-actions";
import {
  DEFAULT_CATEGORY_CONFIG,
  isDefaultConfigId,
} from "@/lib/config/default-categories";
import { useEncryptionContext } from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { CategoryAssignment } from "@/lib/types";

/**
 * Return type for useCategoryAssignment hook
 */
interface UseCategoryAssignmentReturn {
  /** The current category assignment (if any) */
  assignment: CategoryAssignment | null;
  /** The effective config ID - falls back to default if no assignment */
  effectiveConfigId: string;
  /** Whether the assignment is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh the assignment from server */
  refresh: () => Promise<void>;
  /** Set (upsert) the category config for the contacts list */
  assign: (configId: string) => Promise<boolean>;
  /** Remove the category assignment */
  unassign: () => Promise<boolean>;
}

/**
 * Hook to manage the category assignment for the contacts list
 */
export function useCategoryAssignment(): UseCategoryAssignmentReturn {
  const { isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [assignment, setAssignment] = useState<CategoryAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isUnlocked) {
      setAssignment(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCategoryAssignment();
      if (!result.success) {
        setError(result.error ?? "Failed to fetch category assignment");
        setAssignment(null);
        return;
      }

      setAssignment(result.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch category assignment"
      );
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  }, [isUnlocked]);

  const assign = useCallback(
    async (configId: string): Promise<boolean> => {
      try {
        // Default configs are not stored in the database - they're hardcoded.
        // To "assign" a default config, we remove any existing assignment,
        // which causes effectiveConfigId to fall back to the default.
        if (isDefaultConfigId(configId)) {
          const result = await removeCategoryAssignment(csrfToken);
          if (!result.success) {
            setError(result.error ?? "Failed to reset to default categories");
            return false;
          }

          await refresh();
          return true;
        }

        // For custom configs, store the assignment in the database
        const result = await setCategoryAssignment(configId, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to set category assignment");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to set category assignment"
        );
        return false;
      }
    },
    [csrfToken, refresh]
  );

  const unassign = useCallback(async (): Promise<boolean> => {
    try {
      const result = await removeCategoryAssignment(csrfToken);
      if (!result.success) {
        setError(result.error ?? "Failed to remove category assignment");
        return false;
      }

      await refresh();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove category assignment"
      );
      return false;
    }
  }, [csrfToken, refresh]);

  useEffect(() => {
    if (isUnlocked) {
      void refresh();
    }
  }, [isUnlocked, refresh]);

  // Always fall back to the default config
  const effectiveConfigId = useMemo(() => {
    return assignment?.config_id ?? DEFAULT_CATEGORY_CONFIG.id;
  }, [assignment?.config_id]);

  return {
    assignment,
    effectiveConfigId,
    isLoading,
    error,
    refresh,
    assign,
    unassign,
  };
}
