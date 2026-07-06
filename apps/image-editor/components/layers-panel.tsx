"use client";

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import {
  PUBLIC_TOOL_SIDEBAR_PANEL_CLASS,
  PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS,
} from "@helvety/ui/public-tool-workspace";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  FocusIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import * as React from "react";

import { elementLabel } from "@/lib/editor-reducer";

import type { EditorElement } from "@/lib/editor-types";

/** Props for {@link LayersPanel}. */
interface LayersPanelProps {
  readonly hasImage: boolean;
  readonly elements: EditorElement[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onReorder: (id: string, direction: "up" | "down") => void;
  readonly className?: string;
}

/** Icon shown for each element type in the layers list (matches the command bar). */
function layerIcon(type: EditorElement["type"]): React.JSX.Element {
  switch (type) {
    case "text":
      return <TypeIcon className="size-4 shrink-0" />;
    case "arrow":
      return <ArrowUpRightIcon className="size-4 shrink-0" />;
    case "border":
      return <SquareIcon className="size-4 shrink-0" />;
    case "highlight":
      return <FocusIcon className="size-4 shrink-0" />;
    case "blur":
      return <EyeOffIcon className="size-4 shrink-0" />;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/** Right panel: layer list with reorder and delete. */
export function LayersPanel({
  hasImage,
  elements,
  selectedId,
  onSelect,
  onDelete,
  onReorder,
  className,
}: LayersPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex h-full max-h-full flex-col",
        PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS,
        className
      )}
    >
      <div
        className={cn(
          PUBLIC_TOOL_SIDEBAR_PANEL_CLASS,
          "flex flex-1 flex-col overflow-y-auto"
        )}
      >
        <div>
          <h3 className="text-sm font-semibold">Layers</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Reorder, select, or remove annotations.
          </p>
        </div>

        <div className="mt-4 min-h-0 flex-1">
          {!hasImage ? (
            <p className="text-muted-foreground text-xs">
              Add an image to see layers.
            </p>
          ) : elements.length === 0 ? (
            <p className="text-muted-foreground text-xs">
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
                        <span className="truncate">
                          {elementLabel(element)}
                        </span>
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
      </div>
    </div>
  );
}
