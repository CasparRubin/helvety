"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Transformer,
} from "react-konva";

import {
  createArrowElement,
  createBlurElement,
  createBorderElement,
  createHighlightElement,
  createTextElement,
  normalizeRect,
} from "@/lib/editor-reducer";
import { MIN_DRAG_SIZE_PX } from "@/lib/editor-types";
import { getLogicalStageSize, pointerToImageCoords } from "@/lib/export-image";

import {
  ArrowNode,
  BlurNode,
  BorderNode,
  HighlightNode,
  SpotlightRects,
  TaperedArrowPreview,
  TextNode,
} from "./element-nodes";
import { TextEditOverlay } from "./text-edit-overlay";

import type { EditorAction } from "@/lib/editor-reducer";
import type {
  CropRect,
  EditorElement,
  EditorState,
  TextElement,
} from "@/lib/editor-types";
import type Konva from "konva";

/** In-progress drag rectangle, in natural image coordinates. */
interface DrawPreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Props for the Konva editing stage. */
interface EditorStageProps {
  readonly sourceImage: HTMLImageElement;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly state: EditorState;
  readonly dispatch: (action: EditorAction) => void;
  readonly displayScale: number;
  readonly toolColor: string;
  readonly pendingCrop: CropRect | null;
  readonly onCropDraftChange: (crop: CropRect) => void;
}

/** Konva canvas: renders the image and annotations, and handles drawing/selection. */
export function EditorStage({
  sourceImage,
  imageWidth,
  imageHeight,
  state,
  dispatch,
  displayScale,
  toolColor,
  pendingCrop,
  onCropDraftChange,
}: EditorStageProps): React.JSX.Element {
  const {
    width: stageWidth,
    height: stageHeight,
    crop,
  } = getLogicalStageSize(state, imageWidth, imageHeight);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawPreview, setDrawPreview] = useState<DrawPreview | null>(null);
  const [cropDraft, setCropDraft] = useState<CropRect | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [shiftDown, setShiftDown] = useState(false);

  const selectedElement = state.elements.find(
    (element) => element.id === state.selectedId
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      setShiftDown(event.shiftKey);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

  useEffect(() => {
    if (state.activeTool !== "crop") {
      setCropDraft(null);
      return;
    }
    setCropDraft(
      state.crop ?? {
        x: 0,
        y: 0,
        width: imageWidth,
        height: imageHeight,
      }
    );
  }, [state.activeTool, state.crop, imageWidth, imageHeight]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    if (
      state.activeTool !== "select" ||
      !state.selectedId ||
      selectedElement?.type === "highlight" ||
      selectedElement?.type === "arrow"
    ) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#element-${state.selectedId}`);
    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    }
  }, [state.activeTool, state.selectedId, selectedElement, state.elements]);

  const getImagePointer = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return pointerToImageCoords(pointer.x, pointer.y, crop);
  }, [crop]);

  const finishRectDraw = useCallback(
    (preview: DrawPreview) => {
      if (
        preview.width < MIN_DRAG_SIZE_PX ||
        preview.height < MIN_DRAG_SIZE_PX
      ) {
        return;
      }

      if (state.activeTool === "crop") {
        setCropDraft(preview);
        onCropDraftChange(preview);
        return;
      }

      let element: EditorElement | null = null;
      switch (state.activeTool) {
        case "border":
          element = createBorderElement(
            preview.x,
            preview.y,
            preview.width,
            preview.height,
            toolColor
          );
          break;
        case "highlight":
          element = createHighlightElement(
            preview.x,
            preview.y,
            preview.width,
            preview.height
          );
          break;
        case "blur":
          element = createBlurElement(
            preview.x,
            preview.y,
            preview.width,
            preview.height
          );
          break;
        default:
          break;
      }

      if (element) {
        dispatch({ type: "ADD_ELEMENT", element });
        dispatch({ type: "SET_TOOL", tool: "select" });
      }
    },
    [dispatch, onCropDraftChange, state.activeTool, toolColor]
  );

  const handleStageMouseDown = useCallback(() => {
    const pointer = getImagePointer();
    if (!pointer) return;

    if (state.activeTool === "text") {
      const element = createTextElement(pointer.x, pointer.y, toolColor);
      dispatch({ type: "ADD_ELEMENT", element });
      dispatch({ type: "SET_TOOL", tool: "select" });
      setEditingTextId(element.id);
      return;
    }

    if (state.activeTool === "select") {
      dispatch({ type: "SELECT", id: null });
      return;
    }

    if (state.activeTool === "arrow") {
      setDrawStart(pointer);
      setDrawPreview({
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0,
      });
      return;
    }

    if (
      state.activeTool === "border" ||
      state.activeTool === "highlight" ||
      state.activeTool === "blur" ||
      state.activeTool === "crop"
    ) {
      setDrawStart(pointer);
      setDrawPreview({
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0,
      });
    }
  }, [dispatch, getImagePointer, state.activeTool, toolColor]);

  const handleStageMouseMove = useCallback(() => {
    if (!drawStart) return;
    const pointer = getImagePointer();
    if (!pointer) return;

    if (state.activeTool === "arrow") {
      setDrawPreview({
        x: drawStart.x,
        y: drawStart.y,
        width: pointer.x - drawStart.x,
        height: pointer.y - drawStart.y,
      });
      return;
    }

    const rect = normalizeRect(
      drawStart.x,
      drawStart.y,
      pointer.x,
      pointer.y,
      shiftDown
    );
    setDrawPreview(rect);
  }, [drawStart, getImagePointer, shiftDown, state.activeTool]);

  const handleStageMouseUp = useCallback(() => {
    if (!drawStart || !drawPreview) {
      setDrawStart(null);
      setDrawPreview(null);
      return;
    }

    if (state.activeTool === "arrow") {
      const pointer = getImagePointer();
      if (pointer) {
        const dx = pointer.x - drawStart.x;
        const dy = pointer.y - drawStart.y;
        if (Math.hypot(dx, dy) >= MIN_DRAG_SIZE_PX) {
          const element = createArrowElement(
            drawStart.x,
            drawStart.y,
            pointer.x,
            pointer.y,
            toolColor
          );
          dispatch({ type: "ADD_ELEMENT", element });
          dispatch({ type: "SET_TOOL", tool: "select" });
        }
      }
      setDrawStart(null);
      setDrawPreview(null);
      return;
    }

    finishRectDraw(drawPreview);
    setDrawStart(null);
    setDrawPreview(null);
  }, [
    drawPreview,
    drawStart,
    dispatch,
    finishRectDraw,
    getImagePointer,
    state.activeTool,
    toolColor,
  ]);

  const updateElement = useCallback(
    (id: string, patch: Partial<EditorElement>) => {
      dispatch({ type: "UPDATE_ELEMENT", id, patch });
    },
    [dispatch]
  );

  const draggable = state.activeTool === "select";

  const activeCropOverlay =
    state.activeTool === "crop"
      ? (pendingCrop ?? cropDraft ?? state.crop)
      : null;

  const editingText = state.elements.find(
    (element): element is TextElement =>
      element.id === editingTextId && element.type === "text"
  );

  return (
    <div className="relative inline-block">
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={displayScale}
        scaleY={displayScale}
        style={{
          width: stageWidth * displayScale,
          height: stageHeight * displayScale,
        }}
        onMouseDown={handleStageMouseDown}
        onMousemove={handleStageMouseMove}
        onMouseup={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchmove={handleStageMouseMove}
        onTouchend={handleStageMouseUp}
      >
        <Layer>
          <KonvaImage
            image={sourceImage}
            x={-crop.x}
            y={-crop.y}
            width={imageWidth}
            height={imageHeight}
            listening={false}
          />

          {state.elements.map((element) => {
            const selected = element.id === state.selectedId;
            const onSelect = () => {
              if (state.activeTool === "select") {
                dispatch({ type: "SELECT", id: element.id });
              }
            };

            switch (element.type) {
              case "blur":
                return (
                  <BlurNode
                    key={element.id}
                    id={`element-${element.id}`}
                    element={element}
                    sourceImage={sourceImage}
                    crop={crop}
                    selected={selected}
                    draggable={draggable}
                    onSelect={onSelect}
                    onChange={(patch) => updateElement(element.id, patch)}
                  />
                );
              case "highlight":
                return (
                  <HighlightNode
                    key={element.id}
                    element={element}
                    crop={crop}
                    stageWidth={stageWidth}
                    stageHeight={stageHeight}
                    selected={selected}
                    draggable={draggable}
                    onSelect={onSelect}
                    onChange={(patch) => updateElement(element.id, patch)}
                  />
                );
              case "border":
                return (
                  <BorderNode
                    key={element.id}
                    id={`element-${element.id}`}
                    element={element}
                    crop={crop}
                    selected={selected}
                    draggable={draggable}
                    onSelect={onSelect}
                    onChange={(patch) => updateElement(element.id, patch)}
                  />
                );
              case "arrow":
                return (
                  <ArrowNode
                    key={element.id}
                    element={element}
                    crop={crop}
                    selected={selected}
                    draggable={draggable}
                    onSelect={onSelect}
                    onChange={(patch) => updateElement(element.id, patch)}
                  />
                );
              case "text":
                return (
                  <TextNode
                    key={element.id}
                    id={`element-${element.id}`}
                    element={element}
                    crop={crop}
                    selected={selected}
                    draggable={draggable}
                    onSelect={onSelect}
                    onChange={(patch) => updateElement(element.id, patch)}
                    onEdit={() => setEditingTextId(element.id)}
                  />
                );
              default: {
                const _exhaustive: never = element;
                return _exhaustive;
              }
            }
          })}

          {drawPreview &&
          (state.activeTool === "border" ||
            state.activeTool === "highlight" ||
            state.activeTool === "blur" ||
            state.activeTool === "crop") ? (
            <Rect
              x={drawPreview.x - crop.x}
              y={drawPreview.y - crop.y}
              width={drawPreview.width}
              height={drawPreview.height}
              stroke={state.activeTool === "border" ? toolColor : "#3b82f6"}
              dash={[6, 4]}
              listening={false}
            />
          ) : null}

          {drawPreview && state.activeTool === "arrow" ? (
            <TaperedArrowPreview
              x1={drawPreview.x - crop.x}
              y1={drawPreview.y - crop.y}
              x2={drawPreview.x - crop.x + drawPreview.width}
              y2={drawPreview.y - crop.y + drawPreview.height}
              color={toolColor}
            />
          ) : null}

          {activeCropOverlay ? (
            <GroupCropOverlay
              cropRect={activeCropOverlay}
              viewCrop={crop}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
            />
          ) : null}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            boundBoxFunc={(oldBox, newBox) => {
              if (
                newBox.width < MIN_DRAG_SIZE_PX ||
                newBox.height < MIN_DRAG_SIZE_PX
              ) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {editingText ? (
        <TextEditOverlay
          element={editingText}
          crop={crop}
          displayScale={displayScale}
          onCommit={(text) => {
            updateElement(editingText.id, { text });
            setEditingTextId(null);
          }}
          onCancel={() => setEditingTextId(null)}
        />
      ) : null}
    </div>
  );
}

/** Dims the stage outside the crop rect and outlines the crop region. */
function GroupCropOverlay({
  cropRect,
  viewCrop,
  stageWidth,
  stageHeight,
}: {
  readonly cropRect: CropRect;
  readonly viewCrop: CropRect;
  readonly stageWidth: number;
  readonly stageHeight: number;
}): React.JSX.Element {
  const x = cropRect.x - viewCrop.x;
  const y = cropRect.y - viewCrop.y;

  return (
    <>
      <SpotlightRects
        holeX={x}
        holeY={y}
        holeWidth={cropRect.width}
        holeHeight={cropRect.height}
        stageWidth={stageWidth}
        stageHeight={stageHeight}
        opacity={0.45}
      />
      <Rect
        x={x}
        y={y}
        width={cropRect.width}
        height={cropRect.height}
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[6, 4]}
        listening={false}
      />
    </>
  );
}
