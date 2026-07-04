import Konva from "konva";

import type {
  CropRect,
  EditorElement,
  EditorState,
  ExportFormat,
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
    listening: false,
  });
  node.cache();
  layer.add(node);
}

/** Adds a full-stage dim with a punched-out spotlight hole to the export layer. */
function addHighlightNode(
  layer: Konva.Layer,
  element: Extract<EditorElement, { type: "highlight" }>,
  crop: CropRect,
  stageWidth: number,
  stageHeight: number
): void {
  const group = new Konva.Group({ listening: false });
  group.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: stageWidth,
      height: stageHeight,
      fill: "black",
      opacity: element.dimOpacity,
    })
  );
  group.add(
    new Konva.Rect({
      x: element.x - crop.x,
      y: element.y - crop.y,
      width: element.width,
      height: element.height,
      fill: "white",
      globalCompositeOperation: "destination-out",
    })
  );
  layer.add(group);
}

/** Renders a single annotation into the export layer, offset by the crop. */
function addElementToLayer(
  layer: Konva.Layer,
  element: EditorElement,
  sourceImage: HTMLImageElement,
  crop: CropRect,
  stageWidth: number,
  stageHeight: number
): void {
  switch (element.type) {
    case "blur":
      addBlurNode(layer, element, sourceImage, crop);
      break;
    case "highlight":
      addHighlightNode(layer, element, crop, stageWidth, stageHeight);
      break;
    case "border":
      layer.add(
        new Konva.Rect({
          x: element.x - crop.x,
          y: element.y - crop.y,
          width: element.width,
          height: element.height,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          listening: false,
        })
      );
      break;
    case "arrow":
      layer.add(
        new Konva.Arrow({
          points: element.points.map((value, index) =>
            index % 2 === 0 ? value - crop.x : value - crop.y
          ),
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          fill: element.stroke,
          pointerLength: 12,
          pointerWidth: 12,
          listening: false,
        })
      );
      break;
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

  for (const element of state.elements) {
    addElementToLayer(
      layer,
      element,
      sourceImage,
      crop,
      stageWidth,
      stageHeight
    );
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

/** Converts natural image coordinates to stage-space coordinates. */
export function imageToStageCoords(
  imageX: number,
  imageY: number,
  crop: CropRect
): { x: number; y: number } {
  return { x: imageX - crop.x, y: imageY - crop.y };
}
