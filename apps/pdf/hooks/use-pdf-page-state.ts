// React
import * as React from "react";

// Internal utilities
import { normalizeRotation } from "@/lib/pdf-rotation-math";

/** Return type of usePdfPageState: deletion/rotation state and handlers. */
interface UsePdfPageStateReturn {
  readonly deletedPages: ReadonlySet<number>;
  readonly pageRotations: Readonly<Record<number, number>>;
  readonly deletedCount: number;
  readonly rotatedCount: number;
  readonly toggleDelete: (
    unifiedPageNumber: number,
    totalPages: number,
    onError: (error: string | null) => void
  ) => void;
  readonly rotatePage: (
    unifiedPageNumber: number,
    angle: number,
    onError: (error: string | null) => void
  ) => void;
  readonly resetRotation: (
    unifiedPageNumber: number,
    onError: (error: string | null) => void
  ) => void;
  readonly resetAll: (onError: (error: string | null) => void) => void;
}

/**
 * Custom hook for managing PDF page state (deletions and rotations).
 * Extracted from the PDF app component for better code organization.
 *
 * Handles:
 * - Page deletion state (Set of deleted page numbers)
 * - Page rotation state (Record of page number to rotation angle)
 * - Computed statistics (deleted count, rotated count)
 * - State management handlers with validation
 *
 * @param pageOrder - Current page order array (used for validation)
 * @returns Object containing page state, statistics, and handlers
 *
 * @example
 * ```typescript
 * const pageState = usePdfPageState(pageOrder)
 *
 * // Toggle page deletion
 * pageState.toggleDelete(5, pageOrder.length, setError)
 *
 * // Rotate page
 * pageState.rotatePage(5, 90, setError)
 * ```
 */
export function usePdfPageState(
  pageOrder: ReadonlyArray<number>
): UsePdfPageStateReturn {
  const [deletedPages, setDeletedPages] = React.useState<Set<number>>(
    new Set()
  );
  const deletedPagesRef = React.useRef<ReadonlySet<number>>(deletedPages);
  const [pageRotations, setPageRotations] = React.useState<
    Record<number, number>
  >({});

  React.useEffect(() => {
    deletedPagesRef.current = deletedPages;
  }, [deletedPages]);

  // Memoize computed statistics to prevent unnecessary recalculations
  const deletedCount = React.useMemo(() => {
    return pageOrder.filter((p: number) => deletedPages.has(p)).length;
  }, [pageOrder, deletedPages]);

  const rotatedCount = React.useMemo(() => {
    return pageOrder.filter((page) => (pageRotations[page] ?? 0) !== 0).length;
  }, [pageOrder, pageRotations]);

  // Page deletion toggle with validation
  const toggleDelete = React.useCallback(
    (
      unifiedPageNumber: number,
      totalPages: number,
      onError: (error: string | null) => void
    ): void => {
      const current = deletedPagesRef.current;
      if (!current.has(unifiedPageNumber) && totalPages - current.size <= 1) {
        onError(
          "Cannot delete all pages. At least one page must remain in the document."
        );
        return;
      }

      const next = new Set(current);
      if (next.has(unifiedPageNumber)) {
        next.delete(unifiedPageNumber);
      } else {
        next.add(unifiedPageNumber);
      }
      deletedPagesRef.current = next;
      setDeletedPages(next);
      onError(null);
    },
    []
  );

  // Page rotation with normalization
  const rotatePage = React.useCallback(
    (
      unifiedPageNumber: number,
      angle: number,
      onError: (error: string | null) => void
    ): void => {
      setPageRotations((prev) => {
        const currentRotation = prev[unifiedPageNumber] ?? 0;
        const newRotation = normalizeRotation(currentRotation + angle);
        return {
          ...prev,
          [unifiedPageNumber]: newRotation,
        };
      });
      onError(null);
    },
    []
  );

  // Reset user-applied rotation for a specific page
  // After reset, the page will display at its inherent rotation (from PDF metadata)
  // since effectiveRotation = inherentRotation + userRotation and userRotation becomes 0
  const resetRotation = React.useCallback(
    (
      unifiedPageNumber: number,
      onError: (error: string | null) => void
    ): void => {
      setPageRotations((prev) => {
        const newRotations = { ...prev };
        delete newRotations[unifiedPageNumber];
        return newRotations;
      });
      onError(null);
    },
    []
  );

  // Reset all page state (deletions and user-applied rotations)
  // After reset, all pages will display at their inherent rotations (from PDF metadata)
  const resetAll = React.useCallback(
    (onError: (error: string | null) => void): void => {
      setDeletedPages(new Set());
      setPageRotations({});
      onError(null);
    },
    []
  );

  return {
    deletedPages,
    pageRotations,
    deletedCount,
    rotatedCount,
    toggleDelete,
    rotatePage,
    resetRotation,
    resetAll,
  };
}
