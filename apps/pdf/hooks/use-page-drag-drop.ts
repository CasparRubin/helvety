/**
 * Custom hook for managing page drag-and-drop functionality.
 * Extracted from pdf-page-grid.tsx for better code organization and reusability.
 */

import * as React from "react";

/**
 * Return type for the usePageDragDrop hook.
 */
export interface UsePageDragDropReturn {
  readonly draggedIndex: number | null;
  readonly dragOverIndex: number | null;
  readonly handleDragStart: (index: number) => void;
  readonly handleDragOver: (e: React.DragEvent, index: number) => void;
  readonly handleDragLeave: () => void;
  readonly handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  readonly handleDragEnd: () => void;
}

/**
 * Parameters for the usePageDragDrop hook.
 */
export interface UsePageDragDropParams {
  readonly pageOrder: ReadonlyArray<number>;
  readonly onReorder: (newOrder: number[]) => void;
  readonly announcementId?: string;
}

/**
 * Custom hook for managing page drag-and-drop state and handlers.
 *
 * @param params - Configuration object containing page order, reorder callback, and optional announcement ID
 * @returns Object containing drag state and event handlers
 *
 * @example
 * ```typescript
 * const dragDrop = usePageDragDrop({
 *   pageOrder,
 *   onReorder: setPageOrder,
 *   announcementId: 'page-reorder-announcement'
 * })
 * ```
 */
export function usePageDragDrop({
  pageOrder,
  onReorder,
  announcementId = "page-reorder-announcement",
}: UsePageDragDropParams): UsePageDragDropReturn {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = React.useCallback((index: number): void => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = React.useCallback(
    (e: React.DragEvent, index: number): void => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDragLeave = React.useCallback((): void => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent, dropIndex: number): void => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const newOrder = [...pageOrder];
      const draggedPage = newOrder[draggedIndex];
      if (draggedPage === undefined) return;
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedPage);
      onReorder(newOrder);

      // Announce drag-and-drop completion to screen readers
      const announcement = document.getElementById(announcementId);
      if (announcement) {
        const fromPosition = draggedIndex + 1;
        const toPosition = dropIndex + 1;
        announcement.textContent = `Page moved from position ${fromPosition} to position ${toPosition}`;
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, pageOrder, onReorder, announcementId]
  );

  const handleDragEnd = React.useCallback((): void => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
