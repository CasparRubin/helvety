"use client";

import * as React from "react";

import {
  RESIZE_TARGET_MIN_BYTES,
  clampResizeTargetBytes,
  compressImageToTargetSize,
} from "@/lib/resize-image";

import type { EditorState } from "@/lib/editor-types";

const COMPRESS_DEBOUNCE_MS = 280;

/** Preview state for the Resize tool. */
export interface ResizePreviewState {
  readonly currentBytes: number | null;
  readonly targetBytes: number;
  readonly resultBytes: number | null;
  readonly resultBlob: Blob | null;
  readonly resultWidth: number | null;
  readonly resultHeight: number | null;
  readonly isBuildingComposite: boolean;
  readonly isCompressing: boolean;
  readonly error: string | null;
  readonly setTargetBytes: (bytes: number) => void;
}

/**
 * Builds a JPEG composite of the editor, then debounced-compresses toward a target size.
 * Active only while `enabled` (Resize tool selected with a loaded image).
 */
export function useResizePreview({
  enabled,
  sourceImage,
  naturalWidth,
  naturalHeight,
  state,
}: {
  readonly enabled: boolean;
  readonly sourceImage: HTMLImageElement | null;
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  readonly state: EditorState;
}): ResizePreviewState {
  const [compositeBlob, setCompositeBlob] = React.useState<Blob | null>(null);
  const [currentBytes, setCurrentBytes] = React.useState<number | null>(null);
  const [targetBytes, setTargetBytesState] = React.useState(
    RESIZE_TARGET_MIN_BYTES
  );
  const [resultBlob, setResultBlob] = React.useState<Blob | null>(null);
  const [resultBytes, setResultBytes] = React.useState<number | null>(null);
  const [resultWidth, setResultWidth] = React.useState<number | null>(null);
  const [resultHeight, setResultHeight] = React.useState<number | null>(null);
  const [isBuildingComposite, setIsBuildingComposite] = React.useState(false);
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const userAdjustedTargetRef = React.useRef(false);

  const maxEdge = Math.max(
    state.crop?.width ?? naturalWidth,
    state.crop?.height ?? naturalHeight
  );

  /** Only fields that change the export pixels (omit selection / active tool). */
  const exportState = React.useMemo<EditorState>(
    () => ({
      elements: state.elements,
      selectedId: null,
      activeTool: "select",
      crop: state.crop,
    }),
    [state.elements, state.crop]
  );

  const setTargetBytes = React.useCallback(
    (bytes: number) => {
      userAdjustedTargetRef.current = true;
      const ceiling = currentBytes ?? bytes;
      setTargetBytesState(clampResizeTargetBytes(bytes, ceiling));
    },
    [currentBytes]
  );

  // Build composite when entering Resize or when crop/annotations change.
  React.useEffect(() => {
    if (!enabled || !sourceImage) {
      userAdjustedTargetRef.current = false;
      setCompositeBlob(null);
      setCurrentBytes(null);
      setResultBlob(null);
      setResultBytes(null);
      setResultWidth(null);
      setResultHeight(null);
      setError(null);
      setIsBuildingComposite(false);
      setIsCompressing(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      setIsBuildingComposite(true);
      setError(null);
      try {
        const { exportEditedImage } = await import("@/lib/export-image");
        if (cancelled || controller.signal.aborted) return;
        const blob = await exportEditedImage(sourceImage, exportState, "jpeg");
        if (cancelled || controller.signal.aborted) return;
        setCompositeBlob(blob);
        setCurrentBytes(blob.size);
        setTargetBytesState((prev) => {
          if (!userAdjustedTargetRef.current) {
            return clampResizeTargetBytes(
              Math.min(1024 * 1024, blob.size),
              blob.size
            );
          }
          return clampResizeTargetBytes(prev, blob.size);
        });
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          setError("Could not prepare image for resize.");
          setCompositeBlob(null);
          setCurrentBytes(null);
        }
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setIsBuildingComposite(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, sourceImage, exportState]);

  // Debounced compress whenever composite or target changes.
  React.useEffect(() => {
    if (!enabled || !compositeBlob || currentBytes === null) {
      return;
    }

    const clampedTarget = clampResizeTargetBytes(targetBytes, currentBytes);
    if (clampedTarget !== targetBytes) {
      setTargetBytesState(clampedTarget);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsCompressing(true);
        setError(null);
        try {
          const result = await compressImageToTargetSize(compositeBlob, {
            targetSize: clampedTarget,
            maxWidthOrHeight: maxEdge,
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          setResultBlob(result.blob);
          setResultBytes(result.blob.size);
          setResultWidth(result.width);
          setResultHeight(result.height);
        } catch (err) {
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError("Resize failed.");
          setResultBlob(null);
          setResultBytes(null);
          setResultWidth(null);
          setResultHeight(null);
        } finally {
          if (!controller.signal.aborted) {
            setIsCompressing(false);
          }
        }
      })();
    }, COMPRESS_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [enabled, compositeBlob, currentBytes, targetBytes, maxEdge]);

  return {
    currentBytes,
    targetBytes,
    resultBytes,
    resultBlob,
    resultWidth,
    resultHeight,
    isBuildingComposite,
    isCompressing,
    error,
    setTargetBytes,
  };
}
