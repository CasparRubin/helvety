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
  cornerRadius: number;
}

/** Spotlight hole: geometry for a bright region; dim is rendered once by the shared overlay. */
export interface HighlightElement {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
  dimOpacity: number;
  cornerRadius: number;
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
  cornerRadius: number;
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

/** Default stroke/fill color for arrows and borders (`#ff0066`). */
export const DEFAULT_STROKE = "#ff0066";

/** Default text annotation color. */
export const DEFAULT_TEXT_FILL = "#ffffff";

/** Default outside dim for highlight spotlights (0–1). */
export const DEFAULT_DIM_OPACITY = 0.55;

/** Default blur strength for blur regions (px). */
export const DEFAULT_BLUR_RADIUS = 28;

/** Default corner radius for new rect annotations (border, blur, highlight holes). */
export const DEFAULT_CORNER_RADIUS = 8;

/** Upper bound for property sliders (px); number inputs may exceed this. */
export const SLIDER_MAX_PX = 100;
