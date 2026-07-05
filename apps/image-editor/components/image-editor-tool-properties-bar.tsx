"use client";

import { CommandBar } from "@helvety/ui/command-bar";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Slider } from "@helvety/ui/slider";
import * as React from "react";

import { STROKE_WIDTH_MAX, STROKE_WIDTH_MIN } from "@/lib/default-tool-sizes";
import { elementLabel } from "@/lib/editor-reducer";

import type { EditorElement, EditorTool } from "@/lib/editor-types";

const TOOL_PROPERTIES_BAR_CLASS = "overflow-x-auto";

/** Props for {@link ImageEditorToolPropertiesBar}. */
interface ImageEditorToolPropertiesBarProps {
  readonly hasImage: boolean;
  readonly activeTool: EditorTool;
  readonly elements: EditorElement[];
  readonly selectedId: string | null;
  readonly toolColor: string;
  readonly toolStrokeWidth: number;
  readonly toolBlurRadius: number;
  readonly toolDimOpacity: number;
  readonly onToolColorChange: (color: string) => void;
  readonly onToolStrokeWidthChange: (width: number) => void;
  readonly onToolBlurRadiusChange: (radius: number) => void;
  readonly onToolDimOpacityChange: (opacity: number) => void;
  readonly onUpdate: (id: string, patch: Partial<EditorElement>) => void;
}

/** Desktop color picker for drawing tools. */
function ToolColorPicker({
  id,
  label,
  value,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (color: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-muted-foreground shrink-0 text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-10 cursor-pointer p-0.5"
        aria-label={label}
      />
    </div>
  );
}

/** Label + slider + formatted value for bounded numeric properties. */
function PropertySlider({
  id,
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly formatValue: (value: number) => string;
  readonly onChange: (value: number) => void;
}): React.JSX.Element {
  return (
    <div className="flex min-w-[10rem] items-center gap-2">
      <Label htmlFor={id} className="text-muted-foreground shrink-0 text-xs">
        {label}
      </Label>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(next) => onChange(next as number)}
        aria-label={label}
        className="w-24"
      />
      <span className="text-muted-foreground w-10 shrink-0 text-xs tabular-nums">
        {formatValue(value)}
      </span>
    </div>
  );
}

/** Context-sensitive tool and selection properties below the main command bar. */
export function ImageEditorToolPropertiesBar({
  hasImage,
  activeTool,
  elements,
  selectedId,
  toolColor,
  toolStrokeWidth,
  toolBlurRadius,
  toolDimOpacity,
  onToolColorChange,
  onToolStrokeWidthChange,
  onToolBlurRadiusChange,
  onToolDimOpacityChange,
  onUpdate,
}: ImageEditorToolPropertiesBarProps): React.JSX.Element | null {
  const selected = elements.find((element) => element.id === selectedId);

  if (!hasImage) {
    return (
      <CommandBar variant="translucent" className={TOOL_PROPERTIES_BAR_CLASS}>
        <p className="text-muted-foreground text-xs">
          Open an image to edit tool properties.
        </p>
      </CommandBar>
    );
  }

  const isColorDrawingTool =
    activeTool === "text" || activeTool === "arrow" || activeTool === "border";

  const isDimDrawingTool = activeTool === "blur" || activeTool === "highlight";

  if (activeTool === "select" && selected) {
    return (
      <CommandBar variant="translucent" className={TOOL_PROPERTIES_BAR_CLASS}>
        <span className="text-muted-foreground shrink-0 text-xs">
          {elementLabel(selected)}
        </span>

        {"stroke" in selected ? (
          <ToolColorPicker
            id="prop-stroke-color"
            label="Color"
            value={selected.stroke}
            onChange={(color) => onUpdate(selected.id, { stroke: color })}
          />
        ) : null}

        {"strokeWidth" in selected ? (
          <PropertySlider
            id="prop-stroke-width"
            label="Stroke"
            value={selected.strokeWidth}
            min={STROKE_WIDTH_MIN}
            max={STROKE_WIDTH_MAX}
            step={1}
            formatValue={(value) => `${value}px`}
            onChange={(strokeWidth) => onUpdate(selected.id, { strokeWidth })}
          />
        ) : null}

        {selected.type === "text" ? (
          <>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="prop-text"
                className="text-muted-foreground shrink-0 text-xs"
              >
                Text
              </Label>
              <Input
                id="prop-text"
                value={selected.text}
                onChange={(event) =>
                  onUpdate(selected.id, { text: event.target.value })
                }
                className="h-8 min-w-[8rem]"
              />
            </div>
            <PropertySlider
              id="prop-font-size"
              label="Size"
              value={selected.fontSize}
              min={8}
              max={128}
              step={1}
              formatValue={(value) => `${value}px`}
              onChange={(fontSize) => onUpdate(selected.id, { fontSize })}
            />
            <ToolColorPicker
              id="prop-text-color"
              label="Fill"
              value={selected.fill}
              onChange={(color) => onUpdate(selected.id, { fill: color })}
            />
          </>
        ) : null}

        {selected.type === "blur" ? (
          <PropertySlider
            id="prop-blur-radius"
            label="Blur"
            value={selected.blurRadius}
            min={1}
            max={60}
            step={1}
            formatValue={(value) => `${value}px`}
            onChange={(blurRadius) => onUpdate(selected.id, { blurRadius })}
          />
        ) : null}

        {selected.type === "highlight" ? (
          <PropertySlider
            id="prop-dim-opacity"
            label="Dim"
            value={selected.dimOpacity}
            min={0.1}
            max={0.9}
            step={0.05}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={(dimOpacity) => onUpdate(selected.id, { dimOpacity })}
          />
        ) : null}

        {selected.type === "border" ||
        selected.type === "highlight" ||
        selected.type === "blur" ? (
          <>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="prop-width"
                className="text-muted-foreground shrink-0 text-xs"
              >
                W
              </Label>
              <Input
                id="prop-width"
                type="number"
                min={4}
                value={Math.round(selected.width)}
                onChange={(event) =>
                  onUpdate(selected.id, {
                    width: Number(event.target.value),
                  })
                }
                className="h-8 w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="prop-height"
                className="text-muted-foreground shrink-0 text-xs"
              >
                H
              </Label>
              <Input
                id="prop-height"
                type="number"
                min={4}
                value={Math.round(selected.height)}
                onChange={(event) =>
                  onUpdate(selected.id, {
                    height: Number(event.target.value),
                  })
                }
                className="h-8 w-16"
              />
            </div>
          </>
        ) : null}
      </CommandBar>
    );
  }

  if (isColorDrawingTool) {
    return (
      <CommandBar variant="translucent" className={TOOL_PROPERTIES_BAR_CLASS}>
        <ToolColorPicker
          id="tool-color"
          label="Color"
          value={toolColor}
          onChange={onToolColorChange}
        />

        {activeTool === "arrow" || activeTool === "border" ? (
          <PropertySlider
            id="tool-stroke-width"
            label="Stroke"
            value={toolStrokeWidth}
            min={STROKE_WIDTH_MIN}
            max={STROKE_WIDTH_MAX}
            step={1}
            formatValue={(value) => `${value}px`}
            onChange={onToolStrokeWidthChange}
          />
        ) : null}
      </CommandBar>
    );
  }

  if (isDimDrawingTool) {
    return (
      <CommandBar variant="translucent" className={TOOL_PROPERTIES_BAR_CLASS}>
        {activeTool === "blur" ? (
          <PropertySlider
            id="tool-blur-radius"
            label="Blur"
            value={toolBlurRadius}
            min={1}
            max={60}
            step={1}
            formatValue={(value) => `${value}px`}
            onChange={onToolBlurRadiusChange}
          />
        ) : (
          <PropertySlider
            id="tool-dim-opacity"
            label="Dim"
            value={toolDimOpacity}
            min={0.1}
            max={0.9}
            step={0.05}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={onToolDimOpacityChange}
          />
        )}
      </CommandBar>
    );
  }

  if (activeTool === "crop") {
    return (
      <CommandBar variant="translucent" className={TOOL_PROPERTIES_BAR_CLASS}>
        <p className="text-muted-foreground text-xs">
          Drag to define a crop region, then Apply Crop in the main command bar.
        </p>
      </CommandBar>
    );
  }

  return (
    <CommandBar variant="translucent" className={TOOL_PROPERTIES_BAR_CLASS}>
      <p className="text-muted-foreground text-xs">
        Select a tool or layer to edit properties.
      </p>
    </CommandBar>
  );
}
