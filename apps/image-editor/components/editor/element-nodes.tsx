"use client";

import Konva from "konva";
import { useEffect, useRef } from "react";
import { Arrow, Group, Image as KonvaImage, Rect, Text } from "react-konva";

import type {
  ArrowElement,
  BlurElement,
  BorderElement,
  CropRect,
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
    sourceImage,
  ]);

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

/** Props for {@link HighlightNode}. */
interface HighlightNodeProps {
  readonly element: HighlightElement;
  readonly crop: CropRect;
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly selected: boolean;
  readonly draggable: boolean;
  readonly onSelect: () => void;
  readonly onChange: (patch: Partial<HighlightElement>) => void;
}

/** Spotlight: full-stage dim with a `destination-out` hole over the region. */
export function HighlightNode({
  element,
  crop,
  stageWidth,
  stageHeight,
  selected,
  draggable,
  onSelect,
  onChange,
}: HighlightNodeProps): React.JSX.Element {
  const x = element.x - crop.x;
  const y = element.y - crop.y;

  return (
    <Group
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
    >
      <Group listening={false}>
        <Rect
          x={-x}
          y={-y}
          width={stageWidth}
          height={stageHeight}
          fill="black"
          opacity={element.dimOpacity}
        />
        <Rect
          width={element.width}
          height={element.height}
          fill="white"
          globalCompositeOperation="destination-out"
        />
      </Group>
      {selected ? (
        <Rect
          width={element.width}
          height={element.height}
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
  return (
    <Rect
      id={id}
      x={element.x - crop.x}
      y={element.y - crop.y}
      width={element.width}
      height={element.height}
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

/** Arrow; drag translates both endpoints and resets node position to origin. */
export function ArrowNode({
  element,
  crop,
  selected,
  draggable,
  onSelect,
  onChange,
}: ArrowNodeProps): React.JSX.Element {
  const points = element.points.map((value, index) =>
    index % 2 === 0 ? value - crop.x : value - crop.y
  );

  return (
    <Arrow
      points={points}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      fill={element.stroke}
      pointerLength={12}
      pointerWidth={12}
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
      dash={selected ? [4, 4] : undefined}
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
    />
  );
}
