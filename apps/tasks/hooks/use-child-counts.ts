"use client";

import { useState, useCallback, useEffect } from "react";

import { getSpaceCounts, getItemCounts } from "@/app/actions/task-actions";
import { useEncryptionContext } from "@/lib/crypto";

/** Options for useChildCounts hook */
interface UseChildCountsOptions {
  /** Server-prefetched counts. Skips the initial fetch when provided. */
  initialData?: Record<string, number>;
}

/**
 * Hook to fetch child entity counts for display in entity lists.
 *
 * - For entityType "unit": fetches space counts per unit (no parentId needed).
 * - For entityType "space": fetches item counts per space (parentId = unitId).
 */
export function useChildCounts(
  entityType: "unit" | "space",
  parentId?: string,
  options?: UseChildCountsOptions
): { counts: Record<string, number>; isLoading: boolean } {
  const { isUnlocked } = useEncryptionContext();

  const hasInitialData = options?.initialData !== undefined;
  const [counts, setCounts] = useState<Record<string, number>>(
    options?.initialData ?? {}
  );
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [initialDataConsumed, setInitialDataConsumed] = useState(false);

  const refresh = useCallback(async () => {
    if (!isUnlocked) {
      setCounts({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (entityType === "unit") {
        const result = await getSpaceCounts();
        if (result.success && result.data) {
          setCounts(result.data);
        } else {
          setCounts({});
        }
      } else if (entityType === "space" && parentId) {
        const result = await getItemCounts(parentId);
        if (result.success && result.data) {
          setCounts(result.data);
        } else {
          setCounts({});
        }
      } else {
        setCounts({});
      }
    } catch {
      setCounts({});
    } finally {
      setIsLoading(false);
    }
  }, [entityType, parentId, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) return;

    if (hasInitialData && !initialDataConsumed) {
      setInitialDataConsumed(true);
      return;
    }

    void refresh();
  }, [isUnlocked, refresh, hasInitialData, initialDataConsumed]);

  return { counts, isLoading };
}
