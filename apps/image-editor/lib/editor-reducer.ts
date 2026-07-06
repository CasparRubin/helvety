import { getDefaultToolSizes, STROKE_WIDTH_MIN } from "./default-tool-sizes";
import {
  DEFAULT_BLUR_RADIUS,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_DIM_OPACITY,
  DEFAULT_STROKE,
  DEFAULT_TEXT_FILL,
} from "./editor-types";

import type {
  ArrowElement,
  BlurElement,
  BorderElement,
  CropRect,
  EditorElement,
  EditorState,
  EditorTool,
  HighlightElement,
  TextElement,
} from "./editor-types";

export const initialEditorState: EditorState = {
  elements: [],
  selectedId: null,
  activeTool: "select",
  crop: null,
};

/** Actions accepted by {@link editorReducer}. */
export type EditorAction =
  | { type: "ADD_ELEMENT"; element: EditorElement }
  | { type: "UPDATE_ELEMENT"; id: string; patch: Partial<EditorElement> }
  | { type: "DELETE_ELEMENT"; id: string }
  | { type: "REORDER_ELEMENT"; id: string; direction: "up" | "down" }
  | { type: "SELECT"; id: string | null }
  | { type: "SET_TOOL"; tool: EditorTool }
  | { type: "SET_CROP"; crop: CropRect | null }
  | { type: "RESET_ANNOTATIONS" }
  | { type: "SYNC_HIGHLIGHT_DIM"; dimOpacity: number };

/** Moves an element one step up or down in z-order (array order). */
function reorderElements(
  elements: EditorElement[],
  id: string,
  direction: "up" | "down"
): EditorElement[] {
  const index = elements.findIndex((element) => element.id === id);
  if (index < 0) return elements;

  const targetIndex = direction === "up" ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= elements.length) {
    return elements;
  }

  const next = [...elements];
  const [item] = next.splice(index, 1);
  if (!item) return elements;
  next.splice(targetIndex, 0, item);
  return next;
}

/** Applies a partial update to an element, preserving its discriminant. */
function patchElement(
  element: EditorElement,
  patch: Partial<EditorElement>
): EditorElement {
  return { ...element, ...patch } as EditorElement;
}

/** Pure reducer for all editor state transitions. */
export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "ADD_ELEMENT": {
      if (action.element.type === "highlight") {
        const dimOpacity = action.element.dimOpacity;
        return {
          ...state,
          elements: [
            ...state.elements.map((element) =>
              element.type === "highlight"
                ? { ...element, dimOpacity }
                : element
            ),
            action.element,
          ],
          selectedId: action.element.id,
        };
      }

      return {
        ...state,
        elements: [...state.elements, action.element],
        selectedId: action.element.id,
      };
    }
    case "UPDATE_ELEMENT": {
      const target = state.elements.find((element) => element.id === action.id);
      const patchDimOpacity =
        "dimOpacity" in action.patch ? action.patch.dimOpacity : undefined;
      const syncDim =
        patchDimOpacity !== undefined && target?.type === "highlight";

      return {
        ...state,
        elements: state.elements.map((element) => {
          if (element.id === action.id) {
            return patchElement(element, action.patch);
          }
          if (syncDim && element.type === "highlight") {
            return {
              ...element,
              dimOpacity: patchDimOpacity,
            };
          }
          return element;
        }),
      };
    }
    case "DELETE_ELEMENT":
      return {
        ...state,
        elements: state.elements.filter((element) => element.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case "REORDER_ELEMENT":
      return {
        ...state,
        elements: reorderElements(state.elements, action.id, action.direction),
      };
    case "SELECT":
      return { ...state, selectedId: action.id, activeTool: "select" };
    case "SET_TOOL":
      return { ...state, activeTool: action.tool };
    case "SET_CROP":
      return { ...state, crop: action.crop };
    case "RESET_ANNOTATIONS":
      return {
        ...state,
        elements: [],
        selectedId: null,
        crop: null,
        activeTool: "select",
      };
    case "SYNC_HIGHLIGHT_DIM":
      return {
        ...state,
        elements: state.elements.map((element) =>
          element.type === "highlight"
            ? { ...element, dimOpacity: action.dimOpacity }
            : element
        ),
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Generates a stable unique id for a new element. */
function createElementId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Options when creating a new annotation. */
export interface CreateElementOptions {
  readonly imageWidth?: number;
  readonly imageHeight?: number;
  readonly fontSize?: number;
  readonly strokeWidth?: number;
  readonly blurRadius?: number;
  readonly dimOpacity?: number;
  readonly cornerRadius?: number;
}

/** Creates a text annotation at the given image coordinates. */
export function createTextElement(
  x: number,
  y: number,
  color?: string,
  options?: CreateElementOptions
): TextElement {
  const scaled =
    options?.imageWidth && options?.imageHeight
      ? getDefaultToolSizes(options.imageWidth, options.imageHeight)
      : null;

  return {
    id: createElementId(),
    type: "text",
    x,
    y,
    text: "Text",
    fontSize: options?.fontSize ?? scaled?.fontSize ?? 36,
    fill: color ?? DEFAULT_TEXT_FILL,
    rotation: 0,
  };
}

/** Creates an arrow annotation from tail `(x1, y1)` to head `(x2, y2)`. */
export function createArrowElement(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color?: string,
  options?: CreateElementOptions
): ArrowElement {
  const scaled =
    options?.imageWidth && options?.imageHeight
      ? getDefaultToolSizes(options.imageWidth, options.imageHeight)
      : null;
  const strokeWidth = Math.max(
    STROKE_WIDTH_MIN,
    options?.strokeWidth ?? scaled?.strokeWidth ?? 5
  );

  return {
    id: createElementId(),
    type: "arrow",
    points: [x1, y1, x2, y2],
    stroke: color ?? DEFAULT_STROKE,
    strokeWidth,
  };
}

/** Creates a stroked-rectangle annotation. */
export function createBorderElement(
  x: number,
  y: number,
  width: number,
  height: number,
  color?: string,
  options?: CreateElementOptions
): BorderElement {
  const scaled =
    options?.imageWidth && options?.imageHeight
      ? getDefaultToolSizes(options.imageWidth, options.imageHeight)
      : null;
  const strokeWidth = Math.max(
    STROKE_WIDTH_MIN,
    options?.strokeWidth ?? scaled?.strokeWidth ?? 5
  );

  return {
    id: createElementId(),
    type: "border",
    x,
    y,
    width,
    height,
    stroke: color ?? DEFAULT_STROKE,
    strokeWidth,
    cornerRadius: options?.cornerRadius ?? DEFAULT_CORNER_RADIUS,
  };
}

/** Creates a highlight hole (shared dim overlay renders all holes). */
export function createHighlightElement(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: CreateElementOptions
): HighlightElement {
  return {
    id: createElementId(),
    type: "highlight",
    x,
    y,
    width,
    height,
    dimOpacity: options?.dimOpacity ?? DEFAULT_DIM_OPACITY,
    cornerRadius: options?.cornerRadius ?? DEFAULT_CORNER_RADIUS,
  };
}

/** Creates a blur-region annotation. */
export function createBlurElement(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: CreateElementOptions
): BlurElement {
  return {
    id: createElementId(),
    type: "blur",
    x,
    y,
    width,
    height,
    blurRadius: options?.blurRadius ?? DEFAULT_BLUR_RADIUS,
    cornerRadius: options?.cornerRadius ?? DEFAULT_CORNER_RADIUS,
  };
}

/** Normalizes a drag into a positive-size rect; `constrainSquare` forces 1:1. */
export function normalizeRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  constrainSquare: boolean
): { x: number; y: number; width: number; height: number } {
  let width = x2 - x1;
  let height = y2 - y1;
  const x = width < 0 ? x2 : x1;
  const y = height < 0 ? y2 : y1;
  width = Math.abs(width);
  height = Math.abs(height);

  if (constrainSquare) {
    const size = Math.max(width, height);
    width = size;
    height = size;
  }

  return { x, y, width, height };
}

/** Human-readable label for an element, shown in the layers panel. */
export function elementLabel(element: EditorElement): string {
  switch (element.type) {
    case "text": {
      const preview =
        element.text.length > 16
          ? `${element.text.slice(0, 16)}…`
          : element.text;
      return `Text: "${preview}"`;
    }
    case "arrow":
      return "Arrow";
    case "border":
      return "Border";
    case "highlight":
      return "Highlight";
    case "blur":
      return "Blur";
    default: {
      const _exhaustive: never = element;
      return _exhaustive;
    }
  }
}
