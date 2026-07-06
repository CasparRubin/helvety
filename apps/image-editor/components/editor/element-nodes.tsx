"use client";

import Konva from "konva";
import { useEffect, useRef } from "react";
import {
  Group,
  Circle,
  Image as KonvaImage,
  Line,
  Rect,
  Shape,
  Text,
} from "react-konva";

import { getTextShadowProps } from "@/lib/default-tool-sizes";
import { DEFAULT_DIM_OPACITY } from "@/lib/editor-types";
import {
  clampCornerRadius,
  drawSpotlightCutouts,
} from "@/lib/spotlight-cutout";
import { buildSpotlightRects } from "@/lib/spotlight-rects";
import { buildTaperedArrowPoints } from "@/lib/tapered-arrow";

import type {
  ArrowElement,
  BlurElement,
  BorderElement,
  CropRect,
  EditorTool,
  HighlightElement,
  TextElement,
} from "@/lib/editor-types";

/** Props for {@link BlurNode}. */
interface BlurNodeProps {
  readonly id?: string;
  readonly element: BlurElement;
  readonly sourceImage: HTMLImageElement;
  readonly crop: CropRect;
  readonly selected: boolean;
  readonly draggable: boolean;
  readonly onSelect: () => void;
  readonly onChange: (patch: Partial<BlurElement>) => void;
}

/** Cropped, blur-filtered image region; re-caches when geometry changes. */
export function BlurNode({
  id,
  element,
  sourceImage,
  crop,
  selected,
  draggable,
  onSelect,
  onChange,
}: BlurNodeProps): React.JSX.Element {
  const imageRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const node = imageRef.current;
    if (!node) return;
    node.cache();
    node.getLayer()?.batchDraw();
  }, [
    element.x,
    element.y,
    element.width,
    element.height,
    element.blurRadius,
    element.cornerRadius,
    sourceImage,
  ]);

  const cornerRadius = element.cornerRadius ?? 0;
  const clippedRadius = clampCornerRadius(
    cornerRadius,
    element.width,
    element.height
  );

  return (
    <KonvaImage
      id={id}
      ref={imageRef}
      image={sourceImage}
      x={element.x - crop.x}
      y={element.y - crop.y}
      width={element.width}
      height={element.height}
      crop={{
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      }}
      filters={[Konva.Filters.Blur]}
      blurRadius={element.blurRadius}
      cornerRadius={clippedRadius}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x() + crop.x,
          y: event.target.y() + crop.y,
        });
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x() + crop.x,
          y: node.y() + crop.y,
          width: Math.max(4, node.width() * scaleX),
          height: Math.max(4, node.height() * scaleY),
        });
      }}
      stroke={selected ? "#3b82f6" : undefined}
      strokeWidth={selected ? 1 : 0}
    />
  );
}

/** Props for {@link SpotlightRects}. */
interface SpotlightRectsProps {
  readonly holeX: number;
  readonly holeY: number;
  readonly holeWidth: number;
  readonly holeHeight: number;
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly opacity: number;
  readonly groupOffsetX?: number;
  readonly groupOffsetY?: number;
}

/** Renders dim strips outside a rectangular hole (crop overlay). */
export function SpotlightRects({
  holeX,
  holeY,
  holeWidth,
  holeHeight,
  stageWidth,
  stageHeight,
  opacity,
  groupOffsetX = 0,
  groupOffsetY = 0,
}: SpotlightRectsProps): React.JSX.Element {
  const rects = buildSpotlightRects(
    holeX,
    holeY,
    holeWidth,
    holeHeight,
    stageWidth,
    stageHeight
  );

  return (
    <>
      {rects.map((rect) => (
        <Rect
          key={`${rect.x}:${rect.y}:${rect.width}:${rect.height}`}
          x={rect.x - groupOffsetX}
          y={rect.y - groupOffsetY}
          width={rect.width}
          height={rect.height}
          fill="black"
          opacity={opacity}
          listening={false}
        />
      ))}
    </>
  );
}

/** Props for {@link HighlightDimOverlay}. */
interface HighlightDimOverlayProps {
  readonly highlights: readonly HighlightElement[];
  readonly crop: CropRect;
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly previewHole?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly cornerRadius: number;
  };
  readonly previewDimOpacity?: number;
}

/** Single shared dim layer with all highlight holes punched out. */
export function HighlightDimOverlay({
  highlights,
  crop,
  stageWidth,
  stageHeight,
  previewHole,
  previewDimOpacity,
}: HighlightDimOverlayProps): React.JSX.Element | null {
  const holes = [
    ...highlights.map((highlight) => ({
      x: highlight.x - crop.x,
      y: highlight.y - crop.y,
      width: highlight.width,
      height: highlight.height,
      cornerRadius: highlight.cornerRadius ?? 0,
    })),
    ...(previewHole
      ? [
          {
            x: previewHole.x - crop.x,
            y: previewHole.y - crop.y,
            width: previewHole.width,
            height: previewHole.height,
            cornerRadius: previewHole.cornerRadius,
          },
        ]
      : []),
  ];

  if (holes.length === 0) {
    return null;
  }

  const opacity =
    previewHole !== undefined && previewDimOpacity !== undefined
      ? previewDimOpacity
      : (highlights[0]?.dimOpacity ?? previewDimOpacity ?? DEFAULT_DIM_OPACITY);

  return (
    <Shape
      listening={false}
      sceneFunc={(context) => {
        drawSpotlightCutouts(context._context, {
          stageWidth,
          stageHeight,
          holes,
          opacity,
        });
      }}
    />
  );
}

/** Props for {@link HighlightNode}. */
interface HighlightNodeProps {
  readonly id?: string;
  readonly element: HighlightElement;
  readonly crop: CropRect;
  readonly selected: boolean;
  readonly draggable: boolean;
  readonly onSelect: () => void;
  readonly onChange: (patch: Partial<HighlightElement>) => void;
}

/** Spotlight highlight interaction target (selection, drag, transform). */
export function HighlightNode({
  id,
  element,
  crop,
  selected,
  draggable,
  onSelect,
  onChange,
}: HighlightNodeProps): React.JSX.Element {
  const x = element.x - crop.x;
  const y = element.y - crop.y;
  const cornerRadius = element.cornerRadius ?? 0;
  const selectionRadius = clampCornerRadius(
    cornerRadius,
    element.width,
    element.height
  );

  return (
    <Group
      id={id}
      draggable={draggable}
      x={x}
      y={y}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x() + crop.x,
          y: event.target.y() + crop.y,
        });
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x() + crop.x,
          y: node.y() + crop.y,
          width: Math.max(4, element.width * scaleX),
          height: Math.max(4, element.height * scaleY),
        });
      }}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill="transparent"
        perfectDrawEnabled={false}
      />
      {selected ? (
        <Rect
          width={element.width}
          height={element.height}
          cornerRadius={selectionRadius}
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}

/** Props for {@link BorderNode}. */
interface BorderNodeProps {
  readonly id?: string;
  readonly element: BorderElement;
  readonly crop: CropRect;
  readonly selected: boolean;
  readonly draggable: boolean;
  readonly onSelect: () => void;
  readonly onChange: (patch: Partial<BorderElement>) => void;
}

/** Stroked rectangle; transform commits new position and size. */
export function BorderNode({
  id,
  element,
  crop,
  selected,
  draggable,
  onSelect,
  onChange,
}: BorderNodeProps): React.JSX.Element {
  const cornerRadius = clampCornerRadius(
    element.cornerRadius ?? 0,
    element.width,
    element.height
  );

  return (
    <Rect
      id={id}
      x={element.x - crop.x}
      y={element.y - crop.y}
      width={element.width}
      height={element.height}
      cornerRadius={cornerRadius}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x() + crop.x,
          y: event.target.y() + crop.y,
        });
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x() + crop.x,
          y: node.y() + crop.y,
          width: Math.max(4, node.width() * scaleX),
          height: Math.max(4, node.height() * scaleY),
        });
      }}
      dash={selected ? [4, 4] : undefined}
    />
  );
}

/** Props for {@link ArrowNode}. */
interface ArrowNodeProps {
  readonly element: ArrowElement;
  readonly crop: CropRect;
  readonly selected: boolean;
  readonly draggable: boolean;
  readonly onSelect: () => void;
  readonly onChange: (patch: Partial<ArrowElement>) => void;
}

/** Props for {@link ArrowEndpointHandle}. */
interface ArrowEndpointHandleProps {
  readonly x: number;
  readonly y: number;
  readonly crop: CropRect;
  readonly onDrag: (x: number, y: number) => void;
}

/** Draggable anchor for resizing an arrow endpoint. */
function ArrowEndpointHandle({
  x,
  y,
  crop,
  onDrag,
}: ArrowEndpointHandleProps): React.JSX.Element {
  return (
    <Circle
      x={x}
      y={y}
      radius={6}
      fill="#3b82f6"
      stroke="#ffffff"
      strokeWidth={2}
      draggable
      onMouseDown={(event) => {
        event.cancelBubble = true;
      }}
      onTouchStart={(event) => {
        event.cancelBubble = true;
      }}
      onDragMove={(event) => {
        event.cancelBubble = true;
        const node = event.target;
        onDrag(node.x() + crop.x, node.y() + crop.y);
      }}
      onDragEnd={(event) => {
        event.cancelBubble = true;
        const node = event.target;
        onDrag(node.x() + crop.x, node.y() + crop.y);
      }}
    />
  );
}

/** Tapered arrow; body drag moves both endpoints; tail/tip handles resize when selected. */
export function ArrowNode({
  element,
  crop,
  selected,
  draggable,
  onSelect,
  onChange,
}: ArrowNodeProps): React.JSX.Element {
  const [x1, y1, x2, y2] = element.points;
  const sx1 = x1 - crop.x;
  const sy1 = y1 - crop.y;
  const sx2 = x2 - crop.x;
  const sy2 = y2 - crop.y;

  return (
    <Group
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => {
        const dx = event.target.x();
        const dy = event.target.y();
        event.target.position({ x: 0, y: 0 });
        onChange({
          points: [
            element.points[0] + dx,
            element.points[1] + dy,
            element.points[2] + dx,
            element.points[3] + dy,
          ],
        });
      }}
    >
      <Line
        points={buildTaperedArrowPoints(
          sx1,
          sy1,
          sx2,
          sy2,
          element.strokeWidth
        )}
        closed
        fill={element.stroke}
      />
      {selected ? (
        <>
          <Line
            points={[sx1, sy1, sx2, sy2]}
            stroke="#3b82f6"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
          {draggable ? (
            <>
              <ArrowEndpointHandle
                x={sx1}
                y={sy1}
                crop={crop}
                onDrag={(nx, ny) => {
                  onChange({
                    points: [nx, ny, element.points[2], element.points[3]],
                  });
                }}
              />
              <ArrowEndpointHandle
                x={sx2}
                y={sy2}
                crop={crop}
                onDrag={(nx, ny) => {
                  onChange({
                    points: [element.points[0], element.points[1], nx, ny],
                  });
                }}
              />
            </>
          ) : null}
        </>
      ) : null}
    </Group>
  );
}

/** Props for {@link RectDrawPreview}. */
interface RectDrawPreviewProps {
  readonly rect: CropRect;
  readonly crop: CropRect;
  readonly tool: EditorTool;
  readonly toolColor: string;
  readonly toolStrokeWidth: number;
  readonly toolCornerRadius: number;
}

/** Live rectangle preview while drawing border, highlight, or blur regions. */
export function RectDrawPreview({
  rect,
  crop,
  tool,
  toolColor,
  toolStrokeWidth,
  toolCornerRadius,
}: RectDrawPreviewProps): React.JSX.Element | null {
  if (rect.width < 1 && rect.height < 1) {
    return null;
  }

  const x = rect.x - crop.x;
  const y = rect.y - crop.y;
  const previewRadius = clampCornerRadius(
    toolCornerRadius,
    rect.width,
    rect.height
  );

  if (tool === "highlight") {
    return (
      <Rect
        x={x}
        y={y}
        width={rect.width}
        height={rect.height}
        cornerRadius={previewRadius}
        stroke="#3b82f6"
        strokeWidth={1}
        dash={[6, 4]}
        listening={false}
      />
    );
  }

  if (tool === "blur") {
    return (
      <Rect
        x={x}
        y={y}
        width={rect.width}
        height={rect.height}
        cornerRadius={previewRadius}
        fill="rgba(59,130,246,0.15)"
        stroke="#3b82f6"
        dash={[6, 4]}
        listening={false}
      />
    );
  }

  if (tool === "border") {
    return (
      <Rect
        x={x}
        y={y}
        width={rect.width}
        height={rect.height}
        cornerRadius={previewRadius}
        stroke={toolColor}
        strokeWidth={toolStrokeWidth}
        dash={[6, 4]}
        listening={false}
      />
    );
  }

  return null;
}

/** Props for {@link TaperedArrowPreview}. */
interface TaperedArrowPreviewProps {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  readonly strokeWidth?: number;
}

/** In-progress tapered arrow preview while drawing. */
export function TaperedArrowPreview({
  x1,
  y1,
  x2,
  y2,
  color,
  strokeWidth = 5,
}: TaperedArrowPreviewProps): React.JSX.Element {
  return (
    <Line
      points={buildTaperedArrowPoints(x1, y1, x2, y2, strokeWidth)}
      closed
      fill={color}
      listening={false}
    />
  );
}

/** Props for {@link TextNode}. */
interface TextNodeProps {
  readonly id?: string;
  readonly element: TextElement;
  readonly crop: CropRect;
  readonly selected: boolean;
  readonly draggable: boolean;
  readonly onSelect: () => void;
  readonly onChange: (patch: Partial<TextElement>) => void;
  readonly onEdit: () => void;
}

/** Text label; double-click/tap opens the edit overlay. */
export function TextNode({
  id,
  element,
  crop,
  selected,
  draggable,
  onSelect,
  onChange,
  onEdit,
}: TextNodeProps): React.JSX.Element {
  return (
    <Text
      id={id}
      x={element.x - crop.x}
      y={element.y - crop.y}
      text={element.text}
      fontSize={element.fontSize}
      fill={element.fill}
      rotation={element.rotation}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x() + crop.x,
          y: event.target.y() + crop.y,
        });
      }}
      onTransformEnd={(event) => {
        const node = event.target as Konva.Text;
        onChange({
          x: node.x() + crop.x,
          y: node.y() + crop.y,
          rotation: node.rotation(),
          fontSize: Math.max(8, node.fontSize() * node.scaleX()),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
      stroke={selected ? "#3b82f6" : undefined}
      strokeWidth={selected ? 0.5 : 0}
      {...getTextShadowProps(element.fontSize)}
    />
  );
}
