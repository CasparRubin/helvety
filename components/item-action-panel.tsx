"use client";

/**
 * Item Action Panel - sidebar panel for item properties.
 * Supports stage selection and priority assignment; designed to be
 * extended with milestones, labels, and other fields in the future.
 */

import {
  CalendarIcon,
  CircleHelpIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/dates";
import { renderStageIcon } from "@/lib/icons";
import { PRIORITIES, getPriorityConfig } from "@/lib/priorities";
import { cn } from "@/lib/utils";

import type { Item, Stage } from "@/lib/types";

/** Props for the ItemActionPanel component. */
interface ItemActionPanelProps {
  /** The current item being edited */
  item: Item;
  /** Available stages for this item's space */
  stages: Stage[];
  /** Whether stages are still loading */
  isLoadingStages: boolean;
  /** Callback when the user selects a different stage */
  onStageChange: (stageId: string | null) => void;
  /** Whether a stage change is currently being saved */
  isSavingStage?: boolean;
  /** Callback when the user selects a different priority */
  onPriorityChange: (priority: number) => void;
  /** Whether a priority change is currently being saved */
  isSavingPriority?: boolean;
}

/**
 * Renders the action panel for an item editor.
 * Provides a stage selector and will host future property editors.
 */
export function ItemActionPanel({
  item,
  stages,
  isLoadingStages,
  onStageChange,
  isSavingStage,
  onPriorityChange,
  isSavingPriority,
}: ItemActionPanelProps) {
  const handleStageClick = useCallback(
    (stageId: string | null) => {
      // Don't fire if already on this stage
      if (item.stage_id === stageId) return;
      onStageChange(stageId);
    },
    [item.stage_id, onStageChange]
  );

  const currentPriority = getPriorityConfig(item.priority);

  const handlePriorityClick = useCallback(
    (priority: number) => {
      // Don't fire if already this priority
      if (item.priority === priority) return;
      onPriorityChange(priority);
    },
    [item.priority, onPriorityChange]
  );

  return (
    <aside className="w-full md:sticky md:top-20 md:w-80 md:shrink-0">
      <Card size="sm">
        <CardContent>
          {/* Dates section */}
          <div>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Dates
            </h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-muted-foreground size-3.5 shrink-0" />
                <span className="text-muted-foreground text-xs">Created</span>
                <span className="ml-auto text-xs font-medium">
                  {formatDateTime(item.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PencilIcon className="text-muted-foreground size-3.5 shrink-0" />
                <span className="text-muted-foreground text-xs">Modified</span>
                <span className="ml-auto text-xs font-medium">
                  {formatDateTime(item.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Stage section */}
          <div>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              Stage
              {isSavingStage && <Loader2Icon className="size-3 animate-spin" />}
            </h3>

            {isLoadingStages ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                <span className="text-muted-foreground text-sm">
                  Loading stages...
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {/* Stage buttons */}
                {stages.map((stage) => {
                  const isActive = item.stage_id === stage.id;
                  return (
                    <Button
                      key={stage.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSavingStage}
                      className={cn(
                        "h-auto justify-start gap-2 px-2.5 py-1.5",
                        isActive && "ring-ring/30 bg-muted ring-1"
                      )}
                      style={
                        isActive && stage.color
                          ? { backgroundColor: `${stage.color}18` }
                          : undefined
                      }
                      onClick={() => handleStageClick(stage.id)}
                    >
                      {/* Stage icon */}
                      {renderStageIcon(stage.icon, "size-4 shrink-0", {
                        color: stage.color ?? "var(--muted-foreground)",
                      })}
                      {/* Color dot */}
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            stage.color ?? "var(--muted-foreground)",
                        }}
                      />
                      {/* Stage name */}
                      <span
                        className={cn(
                          "truncate text-sm",
                          isActive ? "font-medium" : "font-normal"
                        )}
                      >
                        {stage.name}
                      </span>
                    </Button>
                  );
                })}

                {/* Unstaged option */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSavingStage}
                  className={cn(
                    "h-auto justify-start gap-2 px-2.5 py-1.5",
                    item.stage_id === null && "ring-ring/30 bg-muted ring-1"
                  )}
                  onClick={() => handleStageClick(null)}
                >
                  <CircleHelpIcon className="text-muted-foreground size-4 shrink-0" />
                  <span className="bg-muted-foreground/40 size-2 shrink-0 rounded-full" />
                  <span
                    className={cn(
                      "text-muted-foreground truncate text-sm",
                      item.stage_id === null ? "font-medium" : "font-normal"
                    )}
                  >
                    Unstaged
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Priority section */}
          <Separator className="my-4" />
          <div>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              Priority
              {isSavingPriority && (
                <Loader2Icon className="size-3 animate-spin" />
              )}
            </h3>

            <div className="flex flex-col gap-1">
              {PRIORITIES.map((prio) => {
                const isActive = currentPriority.value === prio.value;
                const Icon = prio.icon;
                return (
                  <Button
                    key={prio.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSavingPriority}
                    className={cn(
                      "h-auto justify-start gap-2 px-2.5 py-1.5",
                      isActive && "ring-ring/30 bg-muted ring-1"
                    )}
                    style={
                      isActive
                        ? { backgroundColor: `${prio.color}18` }
                        : undefined
                    }
                    onClick={() => handlePriorityClick(prio.value)}
                  >
                    {/* Priority icon */}
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: prio.color }}
                    />
                    {/* Color dot */}
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: prio.color }}
                    />
                    {/* Priority label */}
                    <span
                      className={cn(
                        "truncate text-sm",
                        isActive ? "font-medium" : "font-normal"
                      )}
                    >
                      {prio.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Future sections (Labels, Milestones, etc.) will go here */}
        </CardContent>
      </Card>
    </aside>
  );
}
