"use client";

import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import * as React from "react";

import { elementLabel } from "@/lib/editor-reducer";
import { cn } from "@/lib/utils";

import type { EditorElement } from "@/lib/editor-types";

/** Props for {@link LayersPanel}. */
interface LayersPanelProps {
  readonly elements: EditorElement[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onReorder: (id: string, direction: "up" | "down") => void;
  readonly onUpdate: (id: string, patch: Partial<EditorElement>) => void;
  readonly className?: string;
}

/** Icon shown for each element type in the layers list (matches the toolbar). */
function layerIcon(type: EditorElement["type"]): React.JSX.Element {
  switch (type) {
    case "text":
      return <TypeIcon className="size-4 shrink-0" />;
    case "arrow":
      return <ArrowUpRightIcon className="size-4 shrink-0" />;
    case "border":
      return <SquareIcon className="size-4 shrink-0" />;
    case "highlight":
      return <SparklesIcon className="size-4 shrink-0" />;
    case "blur":
      return <EyeOffIcon className="size-4 shrink-0" />;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/** Left panel: layer list with reorder/delete plus a properties editor. */
export function LayersPanel({
  elements,
  selectedId,
  onSelect,
  onDelete,
  onReorder,
  onUpdate,
  className,
}: LayersPanelProps): React.JSX.Element {
  const selected = elements.find((element) => element.id === selectedId);

  return (
    <aside
      className={cn(
        "bg-card border-border/50 flex w-full shrink-0 flex-col border-r lg:w-[320px]",
        className
      )}
    >
      <div className="border-border/50 border-b px-4 py-3">
        <h2 className="text-sm font-medium">Layers</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Reorder, edit, or remove annotations.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {elements.length === 0 ? (
          <p className="text-muted-foreground px-2 py-4 text-xs">
            No layers yet. Use a tool to add annotations.
          </p>
        ) : (
          <ul className="space-y-1">
            {[...elements].reverse().map((element, reverseIndex) => {
              const index = elements.length - 1 - reverseIndex;
              return (
                <li key={element.id}>
                  <div
                    className={cn(
                      "hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-2",
                      selectedId === element.id && "bg-muted"
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                      onClick={() => onSelect(element.id)}
                    >
                      {layerIcon(element.type)}
                      <span className="truncate">{elementLabel(element)}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move layer up"
                        disabled={index >= elements.length - 1}
                        onClick={() => onReorder(element.id, "up")}
                      >
                        <ChevronUpIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move layer down"
                        disabled={index <= 0}
                        onClick={() => onReorder(element.id, "down")}
                      >
                        <ChevronDownIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete layer"
                        onClick={() => onDelete(element.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected ? (
        <div className="border-border/50 space-y-3 border-t p-4">
          <p className="text-sm font-medium">Properties</p>
          {"stroke" in selected ? (
            <div className="space-y-1">
              <Label htmlFor="layer-color">Color</Label>
              <Input
                id="layer-color"
                type="color"
                value={selected.stroke}
                onChange={(event) =>
                  onUpdate(selected.id, { stroke: event.target.value })
                }
              />
            </div>
          ) : null}
          {"strokeWidth" in selected ? (
            <div className="space-y-1">
              <Label htmlFor="layer-stroke-width">Stroke width</Label>
              <Input
                id="layer-stroke-width"
                type="number"
                min={1}
                max={20}
                value={selected.strokeWidth}
                onChange={(event) =>
                  onUpdate(selected.id, {
                    strokeWidth: Number(event.target.value),
                  })
                }
              />
            </div>
          ) : null}
          {selected.type === "text" ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="layer-text">Text</Label>
                <Input
                  id="layer-text"
                  value={selected.text}
                  onChange={(event) =>
                    onUpdate(selected.id, { text: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="layer-font-size">Font size</Label>
                <Input
                  id="layer-font-size"
                  type="number"
                  min={8}
                  max={128}
                  value={selected.fontSize}
                  onChange={(event) =>
                    onUpdate(selected.id, {
                      fontSize: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="layer-text-color">Color</Label>
                <Input
                  id="layer-text-color"
                  type="color"
                  value={selected.fill}
                  onChange={(event) =>
                    onUpdate(selected.id, { fill: event.target.value })
                  }
                />
              </div>
            </>
          ) : null}
          {selected.type === "blur" ? (
            <div className="space-y-1">
              <Label htmlFor="layer-blur-radius">Blur radius</Label>
              <Input
                id="layer-blur-radius"
                type="number"
                min={1}
                max={60}
                value={selected.blurRadius}
                onChange={(event) =>
                  onUpdate(selected.id, {
                    blurRadius: Number(event.target.value),
                  })
                }
              />
            </div>
          ) : null}
          {selected.type === "highlight" ? (
            <div className="space-y-1">
              <Label htmlFor="layer-dim-opacity">Dim opacity</Label>
              <Input
                id="layer-dim-opacity"
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
              />
            </div>
          ) : null}
          {selected.type === "border" ||
          selected.type === "highlight" ||
          selected.type === "blur" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="layer-width">Width</Label>
                <Input
                  id="layer-width"
                  type="number"
                  min={4}
                  value={Math.round(selected.width)}
                  onChange={(event) =>
                    onUpdate(selected.id, {
                      width: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="layer-height">Height</Label>
                <Input
                  id="layer-height"
                  type="number"
                  min={4}
                  value={Math.round(selected.height)}
                  onChange={(event) =>
                    onUpdate(selected.id, {
                      height: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
