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
import { useLabels } from "@/hooks";

import type { LabelConfig } from "@/lib/types";

// =============================================================================
// Label color presets
// =============================================================================

const LABEL_COLORS = [
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
// Suggested icons (common Lucide icon names for labels)
// =============================================================================

const SUGGESTED_ICONS = [
  "circle",
  "square",
  "star",
  "heart",
  "flag",
  "bookmark",
  "tag",
  "bug",
  "check-circle",
  "alert-circle",
  "refresh-cw",
  "trending-up",
  "briefcase",
  "zap",
  "target",
  "award",
  "bell",
  "bolt",
  "box",
  "code",
  "compass",
  "cpu",
  "database",
  "feather",
  "flame",
  "flask-conical",
  "gift",
  "globe",
  "hash",
  "hexagon",
  "key",
  "layers",
  "lightbulb",
  "link",
  "lock",
  "mail",
  "map-pin",
  "message-circle",
  "package",
  "paperclip",
  "pen",
  "rocket",
  "shield",
  "sparkles",
  "tool",
  "type",
  "users",
  "wrench",
];

// =============================================================================
// Helper: Convert kebab-case to PascalCase for Lucide icons
// =============================================================================

/** Convert kebab-case string to PascalCase. */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// =============================================================================
// Helper: Get Lucide icon component by name
// =============================================================================

/** Lucide icon component type. */
type LucideIconComponent = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
}>;

/** Get Lucide icon component by kebab-case name. */
function getLucideIcon(iconName: string): LucideIconComponent {
  const pascalName = toPascalCase(iconName);
  const icons = LucideIcons as unknown as Record<string, LucideIconComponent>;
  const IconComponent = icons[pascalName];
  return IconComponent ?? CircleIcon;
}

// =============================================================================
// Main Label Configurator Dialog
// =============================================================================

/**
 * Props for the LabelConfiguratorContent component (no Dialog wrapper)
 */
export interface LabelConfiguratorContentProps {
  /** All user's label configs (including default) */
  configs: LabelConfig[];
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
 * LabelConfiguratorContent - Inline content for managing label configurations.
 * Designed to be embedded inside a Sheet, Dialog, or any container.
 *
 * Features:
 * - List all existing label configs (including defaults)
 * - Create new config
 * - Select config and edit its labels (name, icon, color)
 * - Reorder labels with up/down arrow buttons
 * - Assign/unassign config to the current space
 * - Default configs are read-only
 */
export function LabelConfiguratorContent({
  configs,
  assignedConfigId,
  onCreateConfig,
  onDeleteConfig,
  onUpdateConfig: _onUpdateConfig,
  onAssignConfig,
  onUnassignConfig,
}: LabelConfiguratorContentProps) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(
    assignedConfigId
  );

  // Load labels for the selected config (not the assigned one)
  const {
    labels,
    isLoading: isLoadingLabels,
    isDefaultConfig,
    create: createLabel,
    update: updateLabel,
    remove: removeLabel,
    reorder: reorderLabels,
  } = useLabels(selectedConfigId);

  const [newConfigName, setNewConfigName] = useState("");
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<string>(
    LABEL_COLORS[0] ?? "#6366f1"
  );
  const [newLabelIcon, setNewLabelIcon] = useState<string>("circle");
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState("");

  // Delete confirmation state
  const [deleteConfigState, setDeleteConfigState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [deleteLabelState, setDeleteLabelState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  // Icon component for new label preview
  const NewLabelIconComponent = useMemo(
    () => getLucideIcon(newLabelIcon),
    [newLabelIcon]
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

  // Create a new label within selected config
  const handleCreateLabel = useCallback(async () => {
    if (!newLabelName.trim() || !selectedConfigId) return;
    setIsCreatingLabel(true);
    try {
      await createLabel({
        config_id: selectedConfigId,
        name: newLabelName.trim(),
        color: newLabelColor,
        icon: newLabelIcon,
        sort_order: labels.length,
      });
      setNewLabelName("");
    } finally {
      setIsCreatingLabel(false);
    }
  }, [
    newLabelName,
    newLabelColor,
    newLabelIcon,
    selectedConfigId,
    labels.length,
    createLabel,
  ]);

  // Save edited label name
  const handleSaveLabelEdit = useCallback(
    async (labelId: string) => {
      if (!editingLabelName.trim()) return;
      await updateLabel(labelId, { name: editingLabelName.trim() });
      setEditingLabelId(null);
      setEditingLabelName("");
    },
    [editingLabelName, updateLabel]
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

  // Delete label confirmation
  const handleDeleteLabelClick = useCallback((id: string, name: string) => {
    setDeleteLabelState({ open: true, id, name });
  }, []);

  const handleDeleteLabelConfirm = useCallback(async () => {
    if (!deleteLabelState.id) return;
    setIsDeleting(true);
    try {
      await removeLabel(deleteLabelState.id);
      setDeleteLabelState({ open: false, id: null, name: null });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteLabelState.id, removeLabel]);

  // Move label up in order
  const handleMoveLabelUp = useCallback(
    async (labelId: string) => {
      const idx = labels.findIndex((l) => l.id === labelId);
      if (idx <= 0) return;

      const current = labels[idx];
      const prev = labels[idx - 1];
      if (!current || !prev) return;

      await reorderLabels([
        { id: current.id, sort_order: prev.sort_order },
        { id: prev.id, sort_order: current.sort_order },
      ]);
    },
    [labels, reorderLabels]
  );

  // Move label down in order
  const handleMoveLabelDown = useCallback(
    async (labelId: string) => {
      const idx = labels.findIndex((l) => l.id === labelId);
      if (idx === -1 || idx >= labels.length - 1) return;

      const current = labels[idx];
      const next = labels[idx + 1];
      if (!current || !next) return;

      await reorderLabels([
        { id: current.id, sort_order: next.sort_order },
        { id: next.id, sort_order: current.sort_order },
      ]);
    },
    [labels, reorderLabels]
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        {view === "list" ? (
          <>
            <div>
              <h3 className="text-base font-semibold">Label Configurations</h3>
              <p className="text-muted-foreground text-sm">
                Create and manage reusable label setups for your items.
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
                  No label configurations yet. Create one above.
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
                  Remove Label Assignment
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
                  : "Add, edit, and reorder labels in this configuration."}
              </p>
            </div>

            <div className="space-y-4 py-4">
              {/* Read-only notice for default configs */}
              {isDefaultConfig && (
                <div className="bg-muted/50 flex items-start gap-2 rounded-md p-3">
                  <InfoIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <p className="text-muted-foreground text-sm">
                    Default configurations cannot be modified. Create your own
                    configuration if you need custom labels.
                  </p>
                </div>
              )}

              {/* Add new label (only for non-default configs) */}
              {!isDefaultConfig && (
                <div className="space-y-3">
                  <Label>Add Label</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Label name..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCreateLabel();
                      }}
                    />
                    <Button
                      onClick={handleCreateLabel}
                      disabled={isCreatingLabel || !newLabelName.trim()}
                      size="icon"
                    >
                      {isCreatingLabel ? (
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
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`size-6 rounded-full border-2 transition-all ${
                            newLabelColor === color
                              ? "border-foreground scale-110"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewLabelColor(color)}
                        />
                      ))}
                      {/* Custom color picker */}
                      <div className="relative">
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          className="absolute inset-0 size-6 cursor-pointer opacity-0"
                        />
                        <div
                          className="border-muted-foreground/30 hover:border-muted-foreground/50 flex size-6 items-center justify-center rounded-full border-2 border-dashed"
                          style={{
                            backgroundColor: LABEL_COLORS.includes(
                              newLabelColor
                            )
                              ? undefined
                              : newLabelColor,
                          }}
                        >
                          {LABEL_COLORS.includes(newLabelColor) && (
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
                            <NewLabelIconComponent className="size-4" />
                            <span className="text-muted-foreground text-xs">
                              {newLabelIcon}
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
                              value={newLabelIcon}
                              onChange={(e) =>
                                setNewLabelIcon(e.target.value.toLowerCase())
                              }
                              className="h-8 text-sm"
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
                                    newLabelIcon === iconName
                                      ? "bg-primary/10 ring-primary/30 ring-1"
                                      : ""
                                  }`}
                                  onClick={() => setNewLabelIcon(iconName)}
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
                </div>
              )}

              {!isDefaultConfig && <Separator />}

              {/* Labels list */}
              {isLoadingLabels ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
                </div>
              ) : labels.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No labels yet. Add one above.
                </p>
              ) : (
                <div className="space-y-1">
                  {labels.map((label, labelIndex) => {
                    const LabelIconComponent = getLucideIcon(label.icon);
                    const isFirst = labelIndex === 0;
                    const isLast = labelIndex === labels.length - 1;
                    return (
                      <div
                        key={label.id}
                        className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                      >
                        {/* Reorder buttons */}
                        {!isDefaultConfig && (
                          <div className="flex shrink-0 flex-col">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground p-0.5 disabled:opacity-30"
                              onClick={() => handleMoveLabelUp(label.id)}
                              disabled={isFirst}
                              title="Move up"
                            >
                              <ChevronUpIcon className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground p-0.5 disabled:opacity-30"
                              onClick={() => handleMoveLabelDown(label.id)}
                              disabled={isLast}
                              title="Move down"
                            >
                              <ChevronDownIcon className="size-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Icon */}
                        <LabelIconComponent
                          className="size-4 shrink-0"
                          style={{
                            color: label.color ?? "var(--muted-foreground)",
                          }}
                        />

                        {/* Color dot */}
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              label.color ?? "var(--muted-foreground)",
                          }}
                        />

                        {/* Name (editable or display) */}
                        {editingLabelId === label.id && !isDefaultConfig ? (
                          <div className="flex flex-1 items-center gap-1">
                            <Input
                              className="h-7 text-sm"
                              value={editingLabelName}
                              onChange={(e) =>
                                setEditingLabelName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  void handleSaveLabelEdit(label.id);
                                if (e.key === "Escape") {
                                  setEditingLabelId(null);
                                  setEditingLabelName("");
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleSaveLabelEdit(label.id)}
                            >
                              <CheckIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingLabelId(null);
                                setEditingLabelName("");
                              }}
                            >
                              <XIcon className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 truncate text-sm">
                              {label.name}
                            </span>

                            {!isDefaultConfig && (
                              <>
                                {/* Icon picker for existing label */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      title="Change icon"
                                    >
                                      <LabelIconComponent className="size-3.5" />
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
                                        defaultValue={label.icon}
                                        onChange={(e) => {
                                          const value =
                                            e.target.value.toLowerCase();
                                          if (value) {
                                            void updateLabel(label.id, {
                                              icon: value,
                                            });
                                          }
                                        }}
                                        className="h-8 text-sm"
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
                                              label.icon === iconName
                                                ? "bg-primary/10 ring-primary/30 ring-1"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              updateLabel(label.id, {
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

                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setEditingLabelId(label.id);
                                    setEditingLabelName(label.name);
                                  }}
                                >
                                  <PencilIcon className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    handleDeleteLabelClick(label.id, label.name)
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
                <Button onClick={handleAssign}>Use for Items</Button>
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

      {/* Delete Label Config Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfigState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfigState({ open: false, id: null, name: null });
          }
        }}
        entityType="labelConfig"
        entityName={deleteConfigState.name ?? undefined}
        onConfirm={handleDeleteConfigConfirm}
        isDeleting={isDeleting}
      />

      {/* Delete Label Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteLabelState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteLabelState({ open: false, id: null, name: null });
          }
        }}
        entityType="label"
        entityName={deleteLabelState.name ?? undefined}
        onConfirm={handleDeleteLabelConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
