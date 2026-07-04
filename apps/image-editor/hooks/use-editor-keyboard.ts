"use client";

import { useEffect } from "react";

/** Options for {@link useEditorKeyboard}. */
interface UseEditorKeyboardOptions {
  readonly onDelete: () => void;
  readonly onEscape: () => void;
  readonly enabled: boolean;
}

/** Wires Delete/Backspace and Escape shortcuts, ignoring text inputs. */
export function useEditorKeyboard({
  onDelete,
  onEscape,
  enabled,
}: UseEditorKeyboardOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onDelete();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onDelete, onEscape]);
}
