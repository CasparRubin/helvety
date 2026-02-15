"use client";

/**
 * Item Action Panel - sidebar panel for item properties.
 * Displays date metadata, stage selection, priority picker, and label assignment
 * in collapsible sections. On desktop, all sections are open by default. On
 * mobile/stacked layouts, all sections start collapsed except Dates.
 */

import { formatDateTime } from "@helvety/shared/dates";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Card, CardContent } from "@helvety/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@helvety/ui/collapsible";
import { Label as FormLabel } from "@helvety/ui/label";
import { Separator } from "@helvety/ui/separator";
import {
  CalendarIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useIsMobile } from "@/hooks";
import { renderStageIcon } from "@/lib/icons";
import { PRIORITIES, getPriorityConfig } from "@/lib/priorities";

import type { Item, Stage, Label } from "@/lib/types";

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
  /** Available labels for this item's space */
  labels: Label[];
  /** Whether labels are still loading */
  isLoadingLabels: boolean;
  /** Callback when the user selects a different label */
  onLabelChange: (labelId: string | null) => void;
  /** Whether a label change is currently being saved */
  isSavingLabel?: boolean;
  /** Callback when the user selects a different priority */
  onPriorityChange: (priority: number) => void;
  /** Whether a priority change is currently being saved */
  isSavingPriority?: boolean;
  /** Callback when the user changes the start date/time */
  onStartDateChange: (date: string | null) => void;
  /** Callback when the user changes the end date/time */
  onEndDateChange: (date: string | null) => void;
  /** Whether a date change is currently being saved */
  isSavingDates?: boolean;
}

/**
 * Renders the action panel for an item editor.
 * Each section (dates, stage, priority, label) is wrapped in a collapsible;
 * stage, priority, and label start collapsed; dates remain open.
 */
export function ItemActionPanel({
  item,
  stages,
  isLoadingStages,
  onStageChange,
  isSavingStage,
  labels,
  isLoadingLabels,
  onLabelChange,
  isSavingLabel,
  onPriorityChange,
  isSavingPriority,
  onStartDateChange,
  onEndDateChange,
  isSavingDates,
}: ItemActionPanelProps) {
  const isMobile = useIsMobile();

  // User-initiated overrides for collapse state. When null, derive from screen size.
  // Sections open by default on desktop, collapsed on mobile/stacked layouts.
  // Dates always stays open via defaultOpen (uncontrolled).
  const [stageOverride, setStageOverride] = useState<boolean | null>(null);
  const [priorityOverride, setPriorityOverride] = useState<boolean | null>(
    null
  );
  const [labelOverride, setLabelOverride] = useState<boolean | null>(null);

  const stageOpen = stageOverride ?? !isMobile;
  const priorityOpen = priorityOverride ?? !isMobile;
  const labelOpen = labelOverride ?? !isMobile;

  const handleStageClick = useCallback(
    (stageId: string | null) => {
      // Don't fire if already on this stage
      if (item.stage_id === stageId) return;
      onStageChange(stageId);
    },
    [item.stage_id, onStageChange]
  );

  const handleLabelClick = useCallback(
    (labelId: string | null) => {
      // Don't fire if already on this label
      if (item.label_id === labelId) return;
      onLabelChange(labelId);
    },
    [item.label_id, onLabelChange]
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
      <Card size="sm" className="bg-surface-panel">
        <CardContent>
          {/* Dates section */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="group flex w-full items-center justify-between">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                Dates
                {isSavingDates && (
                  <Loader2Icon className="size-3 animate-spin" />
                )}
              </h3>
              <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {/* Created tile */}
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="bg-muted flex size-5 items-center justify-center rounded-md">
                      <CalendarIcon className="text-muted-foreground size-3" />
                    </div>
                    <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      Created
                    </span>
                  </div>
                  <p className="text-xs leading-tight font-medium">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
                {/* Modified tile */}
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="bg-muted flex size-5 items-center justify-center rounded-md">
                      <PencilIcon className="text-muted-foreground size-3" />
                    </div>
                    <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      Modified
                    </span>
                  </div>
                  <p className="text-xs leading-tight font-medium">
                    {formatDateTime(item.updated_at)}
                  </p>
                </div>
              </div>

              {/* Start Date/Time picker */}
              <div className="mt-3 grid gap-1.5">
                <FormLabel className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  Start
                </FormLabel>
                <DateTimePicker
                  value={item.start_date}
                  onChange={onStartDateChange}
                  placeholder="Set start date & time"
                  disabled={isSavingDates}
                />
              </div>

              {/* End Date/Time picker */}
              <div className="mt-3 grid gap-1.5">
                <FormLabel className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  End
                </FormLabel>
                <DateTimePicker
                  value={item.end_date}
                  onChange={onEndDateChange}
                  placeholder="Set end date & time"
                  disabled={isSavingDates}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Stage section */}
          <Collapsible open={stageOpen} onOpenChange={setStageOverride}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                Stage
                {isSavingStage && (
                  <Loader2Icon className="size-3 animate-spin" />
                )}
              </h3>
              <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {isLoadingStages ? (
                <div className="mt-2 flex items-center gap-2 py-2">
                  <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading stages...
                  </span>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-1">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Priority section */}
          <Separator className="my-4" />
          <Collapsible open={priorityOpen} onOpenChange={setPriorityOverride}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                Priority
                {isSavingPriority && (
                  <Loader2Icon className="size-3 animate-spin" />
                )}
              </h3>
              <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex flex-col gap-1">
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
            </CollapsibleContent>
          </Collapsible>

          {/* Label section */}
          <Separator className="my-4" />
          <Collapsible open={labelOpen} onOpenChange={setLabelOverride}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between">
              <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                Label
                {isSavingLabel && (
                  <Loader2Icon className="size-3 animate-spin" />
                )}
              </h3>
              <ChevronRightIcon className="text-muted-foreground size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {isLoadingLabels ? (
                <div className="mt-2 flex items-center gap-2 py-2">
                  <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading labels...
                  </span>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-1">
                  {/* Label buttons */}
                  {labels.map((label) => {
                    const isActive = item.label_id === label.id;
                    return (
                      <Button
                        key={label.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSavingLabel}
                        className={cn(
                          "h-auto justify-start gap-2 px-2.5 py-1.5",
                          isActive && "ring-ring/30 bg-muted ring-1"
                        )}
                        style={
                          isActive && label.color
                            ? { backgroundColor: `${label.color}18` }
                            : undefined
                        }
                        onClick={() => handleLabelClick(label.id)}
                      >
                        {/* Label icon */}
                        {renderStageIcon(label.icon, "size-4 shrink-0", {
                          color: label.color ?? "var(--muted-foreground)",
                        })}
                        {/* Color dot */}
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              label.color ?? "var(--muted-foreground)",
                          }}
                        />
                        {/* Label name */}
                        <span
                          className={cn(
                            "truncate text-sm",
                            isActive ? "font-medium" : "font-normal"
                          )}
                        >
                          {label.name}
                        </span>
                      </Button>
                    );
                  })}

                  {/* No Label option */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSavingLabel}
                    className={cn(
                      "h-auto justify-start gap-2 px-2.5 py-1.5",
                      item.label_id === null && "ring-ring/30 bg-muted ring-1"
                    )}
                    onClick={() => handleLabelClick(null)}
                  >
                    <CircleHelpIcon className="text-muted-foreground size-4 shrink-0" />
                    <span className="bg-muted-foreground/40 size-2 shrink-0 rounded-full" />
                    <span
                      className={cn(
                        "text-muted-foreground truncate text-sm",
                        item.label_id === null ? "font-medium" : "font-normal"
                      )}
                    >
                      No Label
                    </span>
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Future sections (Milestones, etc.) can go here */}
        </CardContent>
      </Card>
    </aside>
  );
}
