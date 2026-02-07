"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import {
  getLabelAssignment,
  setLabelAssignment,
  removeLabelAssignment,
} from "@/app/actions/label-actions";
import {
  DEFAULT_LABEL_CONFIG,
  isDefaultLabelConfigId,
} from "@/lib/config/default-labels";
import { useEncryptionContext } from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { LabelAssignment } from "@/lib/types";

/**
 * Return type for useLabelAssignment hook
 */
interface UseLabelAssignmentReturn {
  /** The current label assignment (if any) */
  assignment: LabelAssignment | null;
  /** The effective config ID - falls back to default if no assignment */
  effectiveConfigId: string;
  /** Whether the assignment is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh the assignment from server */
  refresh: () => Promise<void>;
  /** Set (upsert) the label config for this space's items */
  assign: (configId: string) => Promise<boolean>;
  /** Remove the label assignment */
  unassign: () => Promise<boolean>;
}

/**
 * Hook to manage the label assignment for a specific space's items
 * @param parentId - The space ID (labels are always scoped to items within a space)
 */
export function useLabelAssignment(
  parentId: string | null
): UseLabelAssignmentReturn {
  const { isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [assignment, setAssignment] = useState<LabelAssignment | null>(null);
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
      const result = await getLabelAssignment(parentId);
      if (!result.success) {
        setError(result.error ?? "Failed to fetch label assignment");
        setAssignment(null);
        return;
      }

      setAssignment(result.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch label assignment"
      );
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  }, [parentId, isUnlocked]);

  const assign = useCallback(
    async (configId: string): Promise<boolean> => {
      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      try {
        // Default configs are not stored in the database - they're hardcoded.
        // To "assign" a default config, we remove any existing assignment,
        // which causes effectiveConfigId to fall back to the default.
        if (isDefaultLabelConfigId(configId)) {
          const result = await removeLabelAssignment(parentId, csrfToken);
          if (!result.success) {
            setError(result.error ?? "Failed to reset to default labels");
            return false;
          }

          await refresh();
          return true;
        }

        // For custom configs, store the assignment in the database
        const result = await setLabelAssignment(parentId, configId, csrfToken);
        if (!result.success) {
          setError(result.error ?? "Failed to set label assignment");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to set label assignment"
        );
        return false;
      }
    },
    [parentId, csrfToken, refresh]
  );

  const unassign = useCallback(async (): Promise<boolean> => {
    if (!csrfToken) {
      setError("CSRF token not available");
      return false;
    }

    try {
      const result = await removeLabelAssignment(parentId, csrfToken);
      if (!result.success) {
        setError(result.error ?? "Failed to remove label assignment");
        return false;
      }

      await refresh();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove label assignment"
      );
      return false;
    }
  }, [parentId, csrfToken, refresh]);

  useEffect(() => {
    if (isUnlocked) {
      void refresh();
    }
  }, [isUnlocked, refresh]);

  // Always fall back to the default label config
  const effectiveConfigId = useMemo(() => {
    return assignment?.config_id ?? DEFAULT_LABEL_CONFIG.id;
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
