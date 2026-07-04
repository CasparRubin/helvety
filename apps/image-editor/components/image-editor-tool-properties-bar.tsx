"use client";

import { CommandBar } from "@helvety/ui/command-bar";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import * as React from "react";

import { STROKE_WIDTH_MAX, STROKE_WIDTH_MIN } from "@/lib/default-tool-sizes";
import { elementLabel } from "@/lib/editor-reducer";
import { DEFAULT_BLUR_RADIUS, DEFAULT_DIM_OPACITY } from "@/lib/editor-types";

import type { EditorElement, EditorTool } from "@/lib/editor-types";

/** Props for {@link ImageEditorToolPropertiesBar}. */
interface ImageEditorToolPropertiesBarProps {
  readonly hasImage: boolean;
  readonly activeTool: EditorTool;
  readonly elements: EditorElement[];
  readonly selectedId: string | null;
  readonly toolColor: string;
  readonly toolStrokeWidth: number;
  readonly onToolColorChange: (color: string) => void;
  readonly onToolStrokeWidthChange: (width: number) => void;
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

/** Context-sensitive tool and selection properties below the main command bar. */
export function ImageEditorToolPropertiesBar({
  hasImage,
  activeTool,
  elements,
  selectedId,
  toolColor,
  toolStrokeWidth,
  onToolColorChange,
  onToolStrokeWidthChange,
  onUpdate,
}: ImageEditorToolPropertiesBarProps): React.JSX.Element | null {
  const selected = elements.find((element) => element.id === selectedId);

  if (!hasImage) {
    return (
      <CommandBar variant="translucent">
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
      <CommandBar variant="translucent">
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
          <div className="flex items-center gap-2">
            <Label
              htmlFor="prop-stroke-width"
              className="text-muted-foreground shrink-0 text-xs"
            >
              Stroke
            </Label>
            <Input
              id="prop-stroke-width"
              type="number"
              min={STROKE_WIDTH_MIN}
              max={STROKE_WIDTH_MAX}
              value={selected.strokeWidth}
              onChange={(event) =>
                onUpdate(selected.id, {
                  strokeWidth: Number(event.target.value),
                })
              }
              className="h-8 w-16"
            />
          </div>
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
            <div className="flex items-center gap-2">
              <Label
                htmlFor="prop-font-size"
                className="text-muted-foreground shrink-0 text-xs"
              >
                Size
              </Label>
              <Input
                id="prop-font-size"
                type="number"
                min={8}
                max={128}
                value={selected.fontSize}
                onChange={(event) =>
                  onUpdate(selected.id, {
                    fontSize: Number(event.target.value),
                  })
                }
                className="h-8 w-16"
              />
            </div>
            <ToolColorPicker
              id="prop-text-color"
              label="Fill"
              value={selected.fill}
              onChange={(color) => onUpdate(selected.id, { fill: color })}
            />
          </>
        ) : null}

        {selected.type === "blur" ? (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="prop-blur-radius"
              className="text-muted-foreground shrink-0 text-xs"
            >
              Blur
            </Label>
            <Input
              id="prop-blur-radius"
              type="number"
              min={1}
              max={60}
              value={selected.blurRadius}
              onChange={(event) =>
                onUpdate(selected.id, {
                  blurRadius: Number(event.target.value),
                })
              }
              className="h-8 w-16"
            />
          </div>
        ) : null}

        {selected.type === "highlight" ? (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="prop-dim-opacity"
              className="text-muted-foreground shrink-0 text-xs"
            >
              Dim
            </Label>
            <Input
              id="prop-dim-opacity"
              type="number"
              min={0.1}
              max={0.9}
              step={0.05}
              value={selected.dimOpacity}
              onChange={(event) =>
                onUpdate(selected.id, {
                  dimOpacity: Number(event.target.value),
                })
              }
              className="h-8 w-16"
            />
          </div>
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
      <CommandBar variant="translucent">
        <ToolColorPicker
          id="tool-color"
          label="Color"
          value={toolColor}
          onChange={onToolColorChange}
        />

        {activeTool === "arrow" || activeTool === "border" ? (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="tool-stroke-width"
              className="text-muted-foreground shrink-0 text-xs"
            >
              Stroke
            </Label>
            <Input
              id="tool-stroke-width"
              type="number"
              min={STROKE_WIDTH_MIN}
              max={STROKE_WIDTH_MAX}
              value={toolStrokeWidth}
              onChange={(event) =>
                onToolStrokeWidthChange(Number(event.target.value))
              }
              className="h-8 w-16"
            />
          </div>
        ) : null}
      </CommandBar>
    );
  }

  if (isDimDrawingTool) {
    return (
      <CommandBar variant="translucent">
        {activeTool === "blur" ? (
          <p className="text-muted-foreground text-xs">
            Default blur radius: {DEFAULT_BLUR_RADIUS}px
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Default dim opacity: {Math.round(DEFAULT_DIM_OPACITY * 100)}%
          </p>
        )}
      </CommandBar>
    );
  }

  if (activeTool === "crop") {
    return (
      <CommandBar variant="translucent">
        <p className="text-muted-foreground text-xs">
          Drag to define a crop region, then Apply Crop in the main command bar.
        </p>
      </CommandBar>
    );
  }

  return (
    <CommandBar variant="translucent">
      <p className="text-muted-foreground text-xs">
        Select a tool or layer to edit properties.
      </p>
    </CommandBar>
  );
}
