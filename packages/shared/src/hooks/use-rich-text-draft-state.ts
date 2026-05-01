import { useCallback, useMemo, useRef } from "react";

/**
 * Tracks saved/baseline values for title + rich text payload comparisons.
 * Consumers provide already-serialized rich text snapshots.
 */
export function useRichTextDraftState() {
  const savedTitleRef = useRef("");
  const savedDescriptionRef = useRef<string | null>(null);
  const editorBaselineCapturedRef = useRef(false);

  const initializeTitle = useCallback((title: string): void => {
    savedTitleRef.current = title;
  }, []);

  const captureEditorBaseline = useCallback(
    (serializedDescription: string): boolean => {
      if (editorBaselineCapturedRef.current) {
        return false;
      }

      savedDescriptionRef.current = serializedDescription;
      editorBaselineCapturedRef.current = true;
      return true;
    },
    []
  );

  const markSaved = useCallback(
    (title: string, serializedDescription: string | null): void => {
      savedTitleRef.current = title;
      savedDescriptionRef.current = serializedDescription;
    },
    []
  );

  const isDirty = useCallback(
    (title: string, serializedDescription: string | null): boolean =>
      title !== savedTitleRef.current ||
      serializedDescription !== savedDescriptionRef.current,
    []
  );

  const resetDescriptionBaselineCapture = useCallback((): void => {
    editorBaselineCapturedRef.current = false;
  }, []);

  return useMemo(
    () => ({
      initializeTitle,
      captureEditorBaseline,
      markSaved,
      isDirty,
      resetDescriptionBaselineCapture,
    }),
    [
      initializeTitle,
      captureEditorBaseline,
      markSaved,
      isDirty,
      resetDescriptionBaselineCapture,
    ]
  );
}
