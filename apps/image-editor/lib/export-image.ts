import Konva from "konva";

import { getTextShadowProps } from "./default-tool-sizes";
import { DEFAULT_DIM_OPACITY } from "./editor-types";
import { clampCornerRadius, drawSpotlightCutouts } from "./spotlight-cutout";
import { buildTaperedArrowPoints } from "./tapered-arrow";

import type {
  CropRect,
  EditorElement,
  EditorState,
  ExportFormat,
  HighlightElement,
} from "./editor-types";

/** Returns the committed crop, or a full-image rect when no crop is set. */
function getExportCrop(
  state: EditorState,
  imageWidth: number,
  imageHeight: number
): CropRect {
  return (
    state.crop ?? {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
    }
  );
}

/** Adds a cached, blur-filtered image region to the export layer. */
function addBlurNode(
  layer: Konva.Layer,
  element: Extract<EditorElement, { type: "blur" }>,
  sourceImage: HTMLImageElement,
  crop: CropRect
): void {
  const cornerRadius = element.cornerRadius ?? 0;
  const clippedRadius = clampCornerRadius(
    cornerRadius,
    element.width,
    element.height
  );

  const node = new Konva.Image({
    image: sourceImage,
    x: element.x - crop.x,
    y: element.y - crop.y,
    width: element.width,
    height: element.height,
    crop: {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    },
    filters: [Konva.Filters.Blur],
    blurRadius: element.blurRadius,
    cornerRadius: clippedRadius,
    listening: false,
  });

  node.cache();
  layer.add(node);
}

/** Adds one shared spotlight dim layer with all highlight holes punched out. */
function addHighlightDimOverlay(
  layer: Konva.Layer,
  highlights: readonly HighlightElement[],
  crop: CropRect,
  stageWidth: number,
  stageHeight: number
): void {
  if (highlights.length === 0) {
    return;
  }

  const holes = highlights.map((highlight) => ({
    x: highlight.x - crop.x,
    y: highlight.y - crop.y,
    width: highlight.width,
    height: highlight.height,
    cornerRadius: highlight.cornerRadius ?? 0,
  }));

  const opacity = highlights[0]?.dimOpacity ?? DEFAULT_DIM_OPACITY;

  layer.add(
    new Konva.Shape({
      listening: false,
      sceneFunc: (context) => {
        drawSpotlightCutouts(context._context, {
          stageWidth,
          stageHeight,
          holes,
          opacity,
        });
      },
    })
  );
}

/** Renders a single annotation into the export layer, offset by the crop. */
function addElementToLayer(
  layer: Konva.Layer,
  element: EditorElement,
  sourceImage: HTMLImageElement,
  crop: CropRect
): void {
  switch (element.type) {
    case "blur":
      addBlurNode(layer, element, sourceImage, crop);
      break;
    case "highlight":
      // Dim is rendered once by addHighlightDimOverlay before this loop.
      break;
    case "border":
      layer.add(
        new Konva.Rect({
          x: element.x - crop.x,
          y: element.y - crop.y,
          width: element.width,
          height: element.height,
          cornerRadius: clampCornerRadius(
            element.cornerRadius ?? 0,
            element.width,
            element.height
          ),
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          listening: false,
        })
      );
      break;
    case "arrow": {
      const [x1, y1, x2, y2] = element.points;
      const sx1 = x1 - crop.x;
      const sy1 = y1 - crop.y;
      const sx2 = x2 - crop.x;
      const sy2 = y2 - crop.y;
      layer.add(
        new Konva.Line({
          points: buildTaperedArrowPoints(
            sx1,
            sy1,
            sx2,
            sy2,
            element.strokeWidth
          ),
          closed: true,
          fill: element.stroke,
          listening: false,
        })
      );
      break;
    }
    case "text":
      layer.add(
        new Konva.Text({
          x: element.x - crop.x,
          y: element.y - crop.y,
          text: element.text,
          fontSize: element.fontSize,
          fill: element.fill,
          rotation: element.rotation,
          listening: false,
          ...getTextShadowProps(element.fontSize),
        })
      );
      break;
    default: {
      const _exhaustive: never = element;
      return _exhaustive;
    }
  }
}

/** Renders the base image plus all annotations onto an offscreen stage. */
function renderEditorToStage(
  stage: Konva.Stage,
  sourceImage: HTMLImageElement,
  state: EditorState
): void {
  stage.destroyChildren();
  const crop = getExportCrop(
    state,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight
  );
  const stageWidth = crop.width;
  const stageHeight = crop.height;

  stage.width(stageWidth);
  stage.height(stageHeight);
  stage.scale({ x: 1, y: 1 });

  const layer = new Konva.Layer();
  stage.add(layer);

  layer.add(
    new Konva.Image({
      image: sourceImage,
      x: -crop.x,
      y: -crop.y,
      width: sourceImage.naturalWidth,
      height: sourceImage.naturalHeight,
      listening: false,
    })
  );

  const highlights = state.elements.filter(
    (element): element is HighlightElement => element.type === "highlight"
  );
  addHighlightDimOverlay(layer, highlights, crop, stageWidth, stageHeight);

  for (const element of state.elements) {
    addElementToLayer(layer, element, sourceImage, crop);
  }

  layer.draw();
}

/** Renders the edit to a throwaway stage and returns it as an image blob. */
export async function exportEditedImage(
  sourceImage: HTMLImageElement,
  state: EditorState,
  format: ExportFormat
): Promise<Blob> {
  const container = document.createElement("div");
  const stage = new Konva.Stage({ container, width: 1, height: 1 });
  renderEditorToStage(stage, sourceImage, state);

  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const dataUrl = stage.toDataURL({
    mimeType,
    quality: format === "jpeg" ? 0.92 : undefined,
    pixelRatio: 1,
  });
  stage.destroy();

  const response = await fetch(dataUrl);
  return response.blob();
}

/** Logical (pre-fit) stage size and the crop it is derived from. */
export function getLogicalStageSize(
  state: EditorState,
  imageWidth: number,
  imageHeight: number
): { width: number; height: number; crop: CropRect } {
  const crop = getExportCrop(state, imageWidth, imageHeight);
  return { width: crop.width, height: crop.height, crop };
}

/** Converts stage-space coordinates to natural image coordinates. */
export function pointerToImageCoords(
  stageX: number,
  stageY: number,
  crop: CropRect
): { x: number; y: number } {
  return { x: stageX + crop.x, y: stageY + crop.y };
}

/** Reads pointer position from a Konva stage and converts to image coordinates. */
export function getImagePointerFromStage(
  stage: Konva.Stage,
  crop: CropRect
): { x: number; y: number } | null {
  const pointer = stage.getRelativePointerPosition();
  if (!pointer) return null;
  return pointerToImageCoords(pointer.x, pointer.y, crop);
}

/** Converts natural image coordinates to stage-space coordinates. */
export function imageToStageCoords(
  imageX: number,
  imageY: number,
  crop: CropRect
): { x: number; y: number } {
  return { x: imageX - crop.x, y: imageY - crop.y };
}
