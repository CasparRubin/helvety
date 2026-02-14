"use client";

import * as LucideIcons from "lucide-react";
import {
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon,
  PencilIcon,
  CircleIcon,
  InfoIcon,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useStages } from "@/hooks";

import type { StageConfig, EntityType } from "@/lib/types";

// =============================================================================
// Stage color presets
// =============================================================================

const STAGE_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
  "#a855f7", // purple
];

// =============================================================================
// Suggested icons (common Lucide icon names)
// =============================================================================

const SUGGESTED_ICONS = [
  "circle",
  "square",
  "star",
  "heart",
  "flag",
  "bookmark",
  "inbox",
  "check-circle",
  "loader",
  "calendar",
  "clock",
  "home",
  "briefcase",
  "folder",
  "file",
  "search",
  "eye",
  "zap",
  "target",
  "alert-circle",
  "archive",
  "award",
  "bell",
  "book-open",
  "box",
  "check",
  "cloud",
  "code",
  "coffee",
  "compass",
  "cpu",
  "database",
  "edit",
  "feather",
  "film",
  "flask-conical",
  "gift",
  "globe",
  "grid",
  "hash",
  "headphones",
  "hexagon",
  "image",
  "key",
  "layers",
  "layout",
  "lightbulb",
  "link",
  "list",
  "lock",
  "mail",
  "map",
  "map-pin",
  "message-circle",
  "mic",
  "monitor",
  "moon",
  "music",
  "package",
  "paperclip",
  "pause",
  "pen",
  "percent",
  "phone",
  "pie-chart",
  "pin",
  "play",
  "plus",
  "pocket",
  "power",
  "printer",
  "radio",
  "refresh-cw",
  "rocket",
  "rss",
  "save",
  "scissors",
  "send",
  "server",
  "settings",
  "share",
  "shield",
  "shopping-bag",
  "shopping-cart",
  "sidebar",
  "skip-forward",
  "sliders",
  "smartphone",
  "smile",
  "speaker",
  "sun",
  "table",
  "tablet",
  "tag",
  "terminal",
  "thermometer",
  "thumbs-up",
  "thumbs-down",
  "toggle-left",
  "tool",
  "trash",
  "trash-2",
  "trending-up",
  "triangle",
  "truck",
  "tv",
  "type",
  "umbrella",
  "underline",
  "unlock",
  "upload",
  "user",
  "users",
  "video",
  "voicemail",
  "volume",
  "watch",
  "wifi",
  "wind",
  "x",
  "zoom-in",
];

// =============================================================================
// Helper: Convert kebab-case to PascalCase for Lucide icons
// =============================================================================

/**
 * Converts a kebab-case string to PascalCase.
 * Used to transform icon names like "check-circle" to "CheckCircle" for Lucide.
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// =============================================================================
// Helper: Get Lucide icon component by name
// =============================================================================

/**
 * Type for a Lucide icon component with optional className and style props.
 */
type LucideIconComponent = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

/**
 * Retrieves a Lucide icon component by its kebab-case name.
 * Falls back to CircleIcon if the icon is not found.
 */
function getLucideIcon(iconName: string): LucideIconComponent {
  const pascalName = toPascalCase(iconName);
  const icons = LucideIcons as unknown as Record<string, LucideIconComponent>;
  const IconComponent = icons[pascalName];
  return IconComponent ?? CircleIcon;
}

// =============================================================================
// Main Stage Configurator Dialog
// =============================================================================

/**
 * Props for the StageConfiguratorContent component (no Dialog wrapper)
 */
export interface StageConfiguratorContentProps {
  entityType: EntityType;
  /** All user's stage configs (including default) */
  configs: StageConfig[];
  /** Currently assigned config ID (if any) */
  assignedConfigId: string | null;
  /** Callbacks */
  onCreateConfig: (name: string) => Promise<{ id: string } | null>;
  onDeleteConfig: (id: string) => Promise<boolean>;
  onUpdateConfig: (id: string, name: string) => Promise<boolean>;
  onAssignConfig: (configId: string) => Promise<boolean>;
  onUnassignConfig: () => Promise<boolean>;
}

/**
 * StageConfiguratorContent - Inline content for managing stage configurations.
 * Designed to be embedded inside a Sheet, Dialog, or any container.
 *
 * Features:
 * - List all existing stage configs (including defaults)
 * - Create new config
 * - Select config and edit its stages (name, icon, color, rows shown by default)
 * - Reorder stages with up/down arrow buttons
 * - Configure "rows shown by default" per stage (0 = collapsed)
 * - Assign/unassign config to the current entity list
 * - Default configs are read-only
 */
export function StageConfiguratorContent({
  entityType,
  configs,
  assignedConfigId,
  onCreateConfig,
  onDeleteConfig,
  onUpdateConfig: _onUpdateConfig,
  onAssignConfig,
  onUnassignConfig,
}: StageConfiguratorContentProps) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(
    assignedConfigId
  );

  // Load stages for the selected config (not the assigned one)
  const {
    stages,
    isLoading: isLoadingStages,
    isDefaultConfig,
    create: createStage,
    update: updateStage,
    remove: removeStage,
    reorder: reorderStages,
  } = useStages(selectedConfigId);

  const [newConfigName, setNewConfigName] = useState("");
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState<string>(
    STAGE_COLORS[0] ?? "#6366f1"
  );
  const [newStageIcon, setNewStageIcon] = useState<string>("circle");
  const [newStageDefaultRowsShown, setNewStageDefaultRowsShown] = useState(20);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState("");

  // Delete confirmation state
  const [deleteConfigState, setDeleteConfigState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [deleteStageState, setDeleteStageState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const entityLabel =
    entityType === "unit"
      ? "Units"
      : entityType === "space"
        ? "Spaces"
        : "Items";

  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  // Icon component for new stage preview
  const NewStageIconComponent = useMemo(
    () => getLucideIcon(newStageIcon),
    [newStageIcon]
  );

  // Create a new config
  const handleCreateConfig = useCallback(async () => {
    if (!newConfigName.trim()) return;
    setIsCreatingConfig(true);
    try {
      const result = await onCreateConfig(newConfigName.trim());
      if (result) {
        setNewConfigName("");
        setSelectedConfigId(result.id);
        setView("edit");
      }
    } finally {
      setIsCreatingConfig(false);
    }
  }, [newConfigName, onCreateConfig]);

  // Select a config to edit
  const handleSelectConfig = useCallback((configId: string) => {
    setSelectedConfigId(configId);
    setView("edit");
  }, []);

  // Create a new stage within selected config
  const handleCreateStage = useCallback(async () => {
    if (!newStageName.trim() || !selectedConfigId) return;
    setIsCreatingStage(true);
    try {
      await createStage({
        config_id: selectedConfigId,
        name: newStageName.trim(),
        color: newStageColor,
        icon: newStageIcon,
        sort_order: stages.length,
        default_rows_shown: newStageDefaultRowsShown,
      });
      setNewStageName("");
      setNewStageDefaultRowsShown(20);
    } finally {
      setIsCreatingStage(false);
    }
  }, [
    newStageName,
    newStageColor,
    newStageIcon,
    newStageDefaultRowsShown,
    selectedConfigId,
    stages.length,
    createStage,
  ]);

  // Save edited stage name
  const handleSaveStageEdit = useCallback(
    async (stageId: string) => {
      if (!editingStageName.trim()) return;
      await updateStage(stageId, { name: editingStageName.trim() });
      setEditingStageId(null);
      setEditingStageName("");
    },
    [editingStageName, updateStage]
  );

  // Assign config
  const handleAssign = useCallback(async () => {
    if (!selectedConfigId) return;
    await onAssignConfig(selectedConfigId);
  }, [selectedConfigId, onAssignConfig]);

  // Unassign config
  const handleUnassign = useCallback(async () => {
    await onUnassignConfig();
  }, [onUnassignConfig]);

  // Delete config confirmation
  const handleDeleteConfigClick = useCallback((id: string, name: string) => {
    setDeleteConfigState({ open: true, id, name });
  }, []);

  const handleDeleteConfigConfirm = useCallback(async () => {
    if (!deleteConfigState.id) return;
    setIsDeleting(true);
    try {
      await onDeleteConfig(deleteConfigState.id);
      setDeleteConfigState({ open: false, id: null, name: null });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfigState.id, onDeleteConfig]);

  // Delete stage confirmation
  const handleDeleteStageClick = useCallback((id: string, name: string) => {
    setDeleteStageState({ open: true, id, name });
  }, []);

  const handleDeleteStageConfirm = useCallback(async () => {
    if (!deleteStageState.id) return;
    setIsDeleting(true);
    try {
      await removeStage(deleteStageState.id);
      setDeleteStageState({ open: false, id: null, name: null });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStageState.id, removeStage]);

  // Move stage up in order
  const handleMoveStageUp = useCallback(
    async (stageId: string) => {
      const idx = stages.findIndex((s) => s.id === stageId);
      if (idx <= 0) return;

      const current = stages[idx];
      const prev = stages[idx - 1];
      if (!current || !prev) return;

      await reorderStages([
        { id: current.id, sort_order: prev.sort_order },
        { id: prev.id, sort_order: current.sort_order },
      ]);
    },
    [stages, reorderStages]
  );

  // Move stage down in order
  const handleMoveStageDown = useCallback(
    async (stageId: string) => {
      const idx = stages.findIndex((s) => s.id === stageId);
      if (idx === -1 || idx >= stages.length - 1) return;

      const current = stages[idx];
      const next = stages[idx + 1];
      if (!current || !next) return;

      await reorderStages([
        { id: current.id, sort_order: next.sort_order },
        { id: next.id, sort_order: current.sort_order },
      ]);
    },
    [stages, reorderStages]
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        {view === "list" ? (
          <>
            <div>
              <h3 className="text-base font-semibold">Stage Configurations</h3>
              <p className="text-muted-foreground text-sm">
                Create and manage reusable stage setups for your{" "}
                {entityLabel.toLowerCase()}.
              </p>
            </div>

            <div className="space-y-4 py-4">
              {/* Create new config */}
              <div className="flex gap-2">
                <Input
                  placeholder="New configuration name..."
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreateConfig();
                  }}
                />
                <Button
                  onClick={handleCreateConfig}
                  disabled={isCreatingConfig || !newConfigName.trim()}
                  size="sm"
                >
                  {isCreatingConfig ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <PlusIcon className="size-4" />
                  )}
                </Button>
              </div>

              <Separator />

              {/* Config list */}
              {configs.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No stage configurations yet. Create one above.
                </p>
              ) : (
                <div className="space-y-1">
                  {configs.map((config) => {
                    const isDefault = config.isDefault === true;
                    return (
                      <div
                        key={config.id}
                        className={`hover:bg-muted/40 flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
                          config.id === assignedConfigId
                            ? "bg-primary/5 ring-primary/20 ring-1"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          onClick={() => handleSelectConfig(config.id)}
                        >
                          <span className="truncate text-sm font-medium">
                            {config.name}
                          </span>
                          {isDefault && (
                            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                              Default
                            </span>
                          )}
                          {config.id === assignedConfigId && (
                            <span className="text-primary text-xs">
                              (active)
                            </span>
                          )}
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSelectConfig(config.id)}
                          >
                            {isDefault ? (
                              <LucideIcons.Eye className="size-3.5" />
                            ) : (
                              <PencilIcon className="size-3.5" />
                            )}
                          </Button>
                          {!isDefault && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                handleDeleteConfigClick(config.id, config.name)
                              }
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Unassign button */}
            {assignedConfigId && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={handleUnassign}>
                  Remove Stage Assignment
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-sm"
                  onClick={() => setView("list")}
                >
                  Configs
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="truncate">
                  {selectedConfig?.name ?? "..."}
                </span>
                {selectedConfig?.isDefault && (
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                    Default
                  </span>
                )}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isDefaultConfig
                  ? "This is a default configuration and cannot be edited."
                  : "Add, edit, and reorder stages in this configuration."}
              </p>
            </div>

            <div className="space-y-4 py-4">
              {/* Read-only notice for default configs */}
              {isDefaultConfig && (
                <div className="bg-muted/50 flex items-start gap-2 rounded-md p-3">
                  <InfoIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Default configurations cannot be modified. Create your own
                    configuration if you need custom stages.
                  </p>
                </div>
              )}

              {/* Add new stage (only for non-default configs) */}
              {!isDefaultConfig && (
                <div className="space-y-3">
                  <Label>Add Stage</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Stage name..."
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCreateStage();
                      }}
                    />
                    <Button
                      onClick={handleCreateStage}
                      disabled={isCreatingStage || !newStageName.trim()}
                      size="icon"
                    >
                      {isCreatingStage ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <PlusIcon className="size-4" />
                      )}
                    </Button>
                  </div>

                  {/* Color picker with presets and custom */}
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">
                      Color
                    </Label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {STAGE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`size-6 rounded-full border-2 transition-all ${
                            newStageColor === color
                              ? "border-foreground scale-110"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewStageColor(color)}
                        />
                      ))}
                      {/* Custom color picker */}
                      <div className="relative">
                        <input
                          type="color"
                          value={newStageColor}
                          onChange={(e) => setNewStageColor(e.target.value)}
                          className="absolute inset-0 size-6 cursor-pointer opacity-0"
                        />
                        <div
                          className="border-muted-foreground/30 hover:border-muted-foreground/50 flex size-6 items-center justify-center rounded-full border-2 border-dashed"
                          style={{
                            backgroundColor: STAGE_COLORS.includes(
                              newStageColor
                            )
                              ? undefined
                              : newStageColor,
                          }}
                        >
                          {STAGE_COLORS.includes(newStageColor) && (
                            <PlusIcon className="text-muted-foreground size-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">
                      Icon
                    </Label>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2"
                          >
                            <NewStageIconComponent className="size-4" />
                            <span className="text-muted-foreground text-xs">
                              {newStageIcon}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-64 p-2"
                          align="start"
                          side="bottom"
                        >
                          <div className="mb-2">
                            <Input
                              placeholder="Type icon name..."
                              value={newStageIcon}
                              onChange={(e) =>
                                setNewStageIcon(e.target.value.toLowerCase())
                              }
                              className="h-8 text-base md:text-sm"
                            />
                          </div>
                          <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
                            {SUGGESTED_ICONS.map((iconName) => {
                              const IconComp = getLucideIcon(iconName);
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  className={`hover:bg-muted flex size-8 items-center justify-center rounded transition-colors ${
                                    newStageIcon === iconName
                                      ? "bg-primary/10 ring-primary/30 ring-1"
                                      : ""
                                  }`}
                                  onClick={() => setNewStageIcon(iconName)}
                                  title={iconName}
                                >
                                  <IconComp className="size-4" />
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Rows shown by default */}
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">
                      Rows shown by default
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={1000}
                        value={newStageDefaultRowsShown}
                        onChange={(e) =>
                          setNewStageDefaultRowsShown(
                            Math.max(
                              0,
                              Math.min(1000, parseInt(e.target.value) || 0)
                            )
                          )
                        }
                        className="h-8 w-20 text-base md:text-sm"
                      />
                      <span className="text-muted-foreground text-xs">
                        0 = collapsed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!isDefaultConfig && <Separator />}

              {/* Stages list */}
              {isLoadingStages ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
                </div>
              ) : stages.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No stages yet. Add one above.
                </p>
              ) : (
                <div className="space-y-1">
                  {stages.map((stage, stageIndex) => {
                    const StageIconComponent = getLucideIcon(stage.icon);
                    const isFirst = stageIndex === 0;
                    const isLast = stageIndex === stages.length - 1;
                    return (
                      <div
                        key={stage.id}
                        className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                      >
                        {/* Reorder buttons */}
                        {!isDefaultConfig && (
                          <div className="flex shrink-0 flex-col">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground p-0.5 disabled:opacity-30"
                              onClick={() => handleMoveStageUp(stage.id)}
                              disabled={isFirst}
                              title="Move up"
                            >
                              <ChevronUpIcon className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground p-0.5 disabled:opacity-30"
                              onClick={() => handleMoveStageDown(stage.id)}
                              disabled={isLast}
                              title="Move down"
                            >
                              <ChevronDownIcon className="size-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Icon */}
                        <StageIconComponent
                          className="size-4 shrink-0"
                          style={{
                            color: stage.color ?? "var(--muted-foreground)",
                          }}
                        />

                        {/* Color dot */}
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              stage.color ?? "var(--muted-foreground)",
                          }}
                        />

                        {/* Name (editable or display) */}
                        {editingStageId === stage.id && !isDefaultConfig ? (
                          <div className="flex flex-1 items-center gap-1">
                            <Input
                              className="h-7 text-base md:text-sm"
                              value={editingStageName}
                              onChange={(e) =>
                                setEditingStageName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  void handleSaveStageEdit(stage.id);
                                if (e.key === "Escape") {
                                  setEditingStageId(null);
                                  setEditingStageName("");
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleSaveStageEdit(stage.id)}
                            >
                              <CheckIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingStageId(null);
                                setEditingStageName("");
                              }}
                            >
                              <XIcon className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 truncate text-sm">
                              {stage.name}
                            </span>

                            {/* Read-only rows shown for default configs */}
                            {isDefaultConfig && (
                              <span className="text-muted-foreground text-xs">
                                {stage.default_rows_shown === 0
                                  ? "collapsed"
                                  : `${stage.default_rows_shown} rows`}
                              </span>
                            )}

                            {!isDefaultConfig && (
                              <>
                                {/* Icon picker for existing stage */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      title="Change icon"
                                    >
                                      <StageIconComponent className="size-3.5" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-64 p-2"
                                    align="end"
                                    side="bottom"
                                  >
                                    <div className="mb-2">
                                      <Input
                                        placeholder="Type icon name..."
                                        defaultValue={stage.icon}
                                        onChange={(e) => {
                                          const value =
                                            e.target.value.toLowerCase();
                                          if (value) {
                                            void updateStage(stage.id, {
                                              icon: value,
                                            });
                                          }
                                        }}
                                        className="h-8 text-base md:text-sm"
                                      />
                                    </div>
                                    <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
                                      {SUGGESTED_ICONS.map((iconName) => {
                                        const IconComp =
                                          getLucideIcon(iconName);
                                        return (
                                          <button
                                            key={iconName}
                                            type="button"
                                            className={`hover:bg-muted flex size-8 items-center justify-center rounded transition-colors ${
                                              stage.icon === iconName
                                                ? "bg-primary/10 ring-primary/30 ring-1"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              updateStage(stage.id, {
                                                icon: iconName,
                                              })
                                            }
                                            title={iconName}
                                          >
                                            <IconComp className="size-4" />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {/* Rows shown input */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      title="Rows shown by default"
                                    >
                                      {stage.default_rows_shown === 0
                                        ? "collapsed"
                                        : `${stage.default_rows_shown} rows`}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-48 p-3"
                                    align="end"
                                    side="bottom"
                                  >
                                    <div className="space-y-2">
                                      <Label className="text-xs">
                                        Rows shown by default
                                      </Label>
                                      <div className="flex gap-1">
                                        <Input
                                          id={`rows-input-${stage.id}`}
                                          type="number"
                                          min={0}
                                          max={1000}
                                          defaultValue={
                                            stage.default_rows_shown
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              const value = Math.max(
                                                0,
                                                Math.min(
                                                  1000,
                                                  parseInt(
                                                    e.currentTarget.value
                                                  ) || 0
                                                )
                                              );
                                              if (
                                                value !==
                                                stage.default_rows_shown
                                              ) {
                                                void updateStage(stage.id, {
                                                  default_rows_shown: value,
                                                });
                                              }
                                            }
                                          }}
                                          className="h-8 text-base md:text-sm"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          className="h-8 w-8 shrink-0"
                                          onClick={() => {
                                            const input =
                                              document.getElementById(
                                                `rows-input-${stage.id}`
                                              ) as HTMLInputElement | null;
                                            if (input) {
                                              const value = Math.max(
                                                0,
                                                Math.min(
                                                  1000,
                                                  parseInt(input.value) || 0
                                                )
                                              );
                                              if (
                                                value !==
                                                stage.default_rows_shown
                                              ) {
                                                void updateStage(stage.id, {
                                                  default_rows_shown: value,
                                                });
                                              }
                                            }
                                          }}
                                        >
                                          <CheckIcon className="size-4" />
                                        </Button>
                                      </div>
                                      <p className="text-muted-foreground text-xs">
                                        0 = collapsed by default
                                      </p>
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setEditingStageId(stage.id);
                                    setEditingStageName(stage.name);
                                  }}
                                >
                                  <PencilIcon className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteStageClick(stage.id, stage.name)
                                  }
                                >
                                  <TrashIcon className="size-3.5" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setView("list")}>
                Back to Configs
              </Button>
              {selectedConfigId && selectedConfigId !== assignedConfigId && (
                <Button onClick={handleAssign}>Use for {entityLabel}</Button>
              )}
              {selectedConfigId && selectedConfigId === assignedConfigId && (
                <Button variant="secondary" disabled>
                  <CheckIcon className="mr-1.5 size-4" />
                  Active
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Stage Config Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfigState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfigState({ open: false, id: null, name: null });
          }
        }}
        entityType="stageConfig"
        entityName={deleteConfigState.name ?? undefined}
        onConfirm={handleDeleteConfigConfirm}
        isDeleting={isDeleting}
      />

      {/* Delete Stage Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteStageState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteStageState({ open: false, id: null, name: null });
          }
        }}
        entityType="stage"
        entityName={deleteStageState.name ?? undefined}
        onConfirm={handleDeleteStageConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
