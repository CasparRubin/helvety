"use client";

import { useState, useCallback, useEffect } from "react";

import {
  getStageAssignment,
  setStageAssignment,
  removeStageAssignment,
} from "@/app/actions/stage-actions";
import { useEncryptionContext } from "@/lib/crypto";
import { useCSRFToken } from "@/lib/csrf-client";

import type { StageAssignment, EntityType } from "@/lib/types";

/**
 *
 */
interface UseStageAssignmentReturn {
  /** The current stage assignment (if any) */
  assignment: StageAssignment | null;
  /** Whether the assignment is being loaded */
  isLoading: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Refresh the assignment from server */
  refresh: () => Promise<void>;
  /** Set (upsert) the stage config for this entity list */
  assign: (configId: string) => Promise<boolean>;
  /** Remove the stage assignment */
  unassign: () => Promise<boolean>;
}

/**
 * Hook to manage the stage assignment for a specific entity list
 */
export function useStageAssignment(
  entityType: EntityType,
  parentId: string | null
): UseStageAssignmentReturn {
  const { isUnlocked } = useEncryptionContext();
  const csrfToken = useCSRFToken();

  const [assignment, setAssignment] = useState<StageAssignment | null>(null);
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
      const result = await getStageAssignment(entityType, parentId);
      if (!result.success) {
        setError(result.error ?? "Failed to fetch stage assignment");
        setAssignment(null);
        return;
      }

      setAssignment(result.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch stage assignment"
      );
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, parentId, isUnlocked]);

  const assign = useCallback(
    async (configId: string): Promise<boolean> => {
      if (!csrfToken) {
        setError("CSRF token not available");
        return false;
      }

      try {
        const result = await setStageAssignment(
          entityType,
          parentId,
          configId,
          csrfToken
        );
        if (!result.success) {
          setError(result.error ?? "Failed to set stage assignment");
          return false;
        }

        await refresh();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to set stage assignment"
        );
        return false;
      }
    },
    [entityType, parentId, csrfToken, refresh]
  );

  const unassign = useCallback(async (): Promise<boolean> => {
    if (!csrfToken) {
      setError("CSRF token not available");
      return false;
    }

    try {
      const result = await removeStageAssignment(
        entityType,
        parentId,
        csrfToken
      );
      if (!result.success) {
        setError(result.error ?? "Failed to remove stage assignment");
        return false;
      }

      await refresh();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove stage assignment"
      );
      return false;
    }
  }, [entityType, parentId, csrfToken, refresh]);

  useEffect(() => {
    if (isUnlocked) {
      void refresh();
    }
  }, [isUnlocked, refresh]);

  return {
    assignment,
    isLoading,
    error,
    refresh,
    assign,
    unassign,
  };
}
