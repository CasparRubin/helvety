"use client";

import dynamic from "next/dynamic";

import type { EditorAction } from "@/lib/editor-reducer";
import type { CropRect, EditorState } from "@/lib/editor-types";

const EditorStage = dynamic(
  () =>
    import("./editor-stage").then((module) => ({
      default: module.EditorStage,
    })),
  { ssr: false }
);

/** Props forwarded to the dynamically loaded Konva stage. */
interface EditorCanvasProps {
  readonly sourceImage: HTMLImageElement;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly state: EditorState;
  readonly dispatch: (action: EditorAction) => void;
  readonly displayScale: number;
  readonly toolColor: string;
  readonly toolStrokeWidth: number;
  readonly toolBlurRadius: number;
  readonly toolDimOpacity: number;
  readonly toolCornerRadius: number;
  readonly pendingCrop: CropRect | null;
  readonly onCropDraftChange: (crop: CropRect) => void;
}

/** Client-only wrapper that loads the Konva stage without SSR. */
export function EditorCanvas(props: EditorCanvasProps): React.JSX.Element {
  return <EditorStage {...props} />;
}
