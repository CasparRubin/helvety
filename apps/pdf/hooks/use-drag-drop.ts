import * as React from "react";

/** Return type of useDragDrop: drag state and drag/drop event handlers. */
interface UseDragDropReturn {
  readonly isDragging: boolean;
  readonly handleDragEnter: (e: React.DragEvent) => void;
  readonly handleDragLeave: (e: React.DragEvent) => void;
  readonly handleDragOver: (e: React.DragEvent) => void;
  readonly handleDrop: (
    e: React.DragEvent,
    onFilesDropped: (files: FileList) => void
  ) => void;
}

/**
 * Custom hook for managing drag and drop state and handlers.
 * Uses a drag counter to prevent false drag leave events when dragging over child elements.
 *
 * @returns Object containing drag state and event handlers
 */
export function useDragDrop(): UseDragDropReturn {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounterRef = React.useRef<number>(0);

  const handleDragEnter = React.useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent, onFilesDropped: (files: FileList) => void): void => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    []
  );

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
