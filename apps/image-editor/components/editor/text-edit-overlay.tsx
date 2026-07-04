"use client";

import { Textarea } from "@helvety/ui/textarea";
import { useEffect, useRef } from "react";

import { imageToStageCoords } from "@/lib/export-image";

import type { CropRect, TextElement } from "@/lib/editor-types";

/** Props for {@link TextEditOverlay}. */
interface TextEditOverlayProps {
  readonly element: TextElement;
  readonly crop: CropRect;
  readonly displayScale: number;
  readonly onCommit: (text: string) => void;
  readonly onCancel: () => void;
}

/** Positioned textarea for editing a text annotation in place. */
export function TextEditOverlay({
  element,
  crop,
  displayScale,
  onCommit,
  onCancel,
}: TextEditOverlayProps): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stagePos = imageToStageCoords(element.x, element.y, crop);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.select();
  }, []);

  return (
    <Textarea
      ref={textareaRef}
      className="border-primary bg-background text-foreground absolute z-10 resize-none rounded border px-2 py-1 shadow-sm outline-none"
      defaultValue={element.text}
      style={{
        left: stagePos.x * displayScale,
        top: stagePos.y * displayScale,
        fontSize: element.fontSize * displayScale,
        minWidth: 120,
        minHeight: 32,
      }}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onCommit(event.currentTarget.value);
        }
      }}
    />
  );
}
