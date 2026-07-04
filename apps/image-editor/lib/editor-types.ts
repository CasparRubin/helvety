/** Active editing tool; drives pointer behavior on the canvas. */
export type EditorTool =
  "select" | "text" | "arrow" | "border" | "highlight" | "blur" | "crop";

/** Rectangle in natural image pixels, used for crop and rect annotations. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Text annotation placed at a point in natural image coordinates. */
export interface TextElement {
  id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  rotation: number;
}

/** Arrow annotation defined by tail and head points `[x1, y1, x2, y2]`. */
export interface ArrowElement {
  id: string;
  type: "arrow";
  points: [number, number, number, number];
  stroke: string;
  strokeWidth: number;
}

/** Stroked rectangle annotation (outline only, no fill). */
export interface BorderElement {
  id: string;
  type: "border";
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
}

/** Spotlight annotation: dims the whole image except this rectangle. */
export interface HighlightElement {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
  dimOpacity: number;
}

/** Blur annotation: obscures the source image within this rectangle. */
export interface BlurElement {
  id: string;
  type: "blur";
  x: number;
  y: number;
  width: number;
  height: number;
  blurRadius: number;
}

/** Any annotation on the canvas. Array index in state is the z-order. */
export type EditorElement =
  TextElement | ArrowElement | BorderElement | HighlightElement | BlurElement;

/** Complete editor state managed by {@link editorReducer}. */
export interface EditorState {
  elements: EditorElement[];
  selectedId: string | null;
  activeTool: EditorTool;
  crop: CropRect | null;
}

/** Supported export image formats. */
export type ExportFormat = "png" | "jpeg";

export const MIN_DRAG_SIZE_PX = 4;

export const DEFAULT_STROKE = "#ef4444";

export const DEFAULT_TEXT_FILL = "#ffffff";

export const DEFAULT_DIM_OPACITY = 0.55;

export const DEFAULT_BLUR_RADIUS = 12;
