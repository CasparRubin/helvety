import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDragDrop } from "./use-drag-drop";

import type { DragEvent } from "react";

/** Minimal drag event for exercising preventDefault/stopPropagation handlers. */
function dragEvent(files: File[] = []): DragEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: { files } as unknown as DataTransfer,
  } as unknown as DragEvent;
}

describe("useDragDrop", () => {
  it("tracks nested enter/leave with a counter before clearing on drop", () => {
    const { result } = renderHook(() => useDragDrop());
    const onFilesDropped = vi.fn();
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });

    expect(result.current.isDragging).toBe(false);

    act(() => {
      result.current.handleDragEnter(dragEvent());
      result.current.handleDragEnter(dragEvent());
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragLeave(dragEvent());
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragLeave(dragEvent());
    });
    expect(result.current.isDragging).toBe(false);

    act(() => {
      result.current.handleDragEnter(dragEvent());
      result.current.handleDrop(dragEvent([file]), onFilesDropped);
    });

    expect(result.current.isDragging).toBe(false);
    expect(onFilesDropped).toHaveBeenCalledTimes(1);
    expect(onFilesDropped.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it("does not call onFilesDropped for empty drops", () => {
    const { result } = renderHook(() => useDragDrop());
    const onFilesDropped = vi.fn();

    act(() => {
      result.current.handleDragOver(dragEvent());
      result.current.handleDrop(dragEvent([]), onFilesDropped);
    });

    expect(onFilesDropped).not.toHaveBeenCalled();
  });
});
