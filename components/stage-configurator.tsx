"use client";

import {
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  GripVerticalIcon,
  CheckIcon,
  XIcon,
  PencilIcon,
} from "lucide-react";
import { useState, useCallback } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type { StageConfig, Stage, EntityType } from "@/lib/types";

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
// Main Stage Configurator Dialog
// =============================================================================

/**
 *
 */
interface StageConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  /** All user's stage configs */
  configs: StageConfig[];
  /** Stages of the currently selected config */
  stages: Stage[];
  /** Currently assigned config ID (if any) */
  assignedConfigId: string | null;
  /** Whether stages are loading */
  isLoadingStages: boolean;
  /** Callbacks */
  onCreateConfig: (name: string) => Promise<{ id: string } | null>;
  onDeleteConfig: (id: string) => Promise<boolean>;
  onUpdateConfig: (id: string, name: string) => Promise<boolean>;
  onCreateStage: (
    configId: string,
    name: string,
    color: string | null,
    sortOrder: number
  ) => Promise<{ id: string } | null>;
  onUpdateStage: (
    id: string,
    updates: { name?: string; color?: string | null }
  ) => Promise<boolean>;
  onDeleteStage: (id: string) => Promise<boolean>;
  onAssignConfig: (configId: string) => Promise<boolean>;
  onUnassignConfig: () => Promise<boolean>;
}

/**
 * StageConfigurator - Dialog for managing stage configurations.
 *
 * Features:
 * - List all existing stage configs
 * - Create new config
 * - Select config and edit its stages
 * - Assign/unassign config to the current entity list
 */
export function StageConfigurator({
  open,
  onOpenChange,
  entityType,
  configs,
  stages,
  assignedConfigId,
  isLoadingStages,
  onCreateConfig,
  onDeleteConfig,
  onUpdateConfig: _onUpdateConfig,
  onCreateStage,
  onUpdateStage,
  onDeleteStage,
  onAssignConfig,
  onUnassignConfig,
}: StageConfiguratorProps) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(
    assignedConfigId
  );
  const [newConfigName, setNewConfigName] = useState("");
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState<string>(
    STAGE_COLORS[0] ?? "#6366f1"
  );
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
      await onCreateStage(
        selectedConfigId,
        newStageName.trim(),
        newStageColor,
        stages.length
      );
      setNewStageName("");
    } finally {
      setIsCreatingStage(false);
    }
  }, [
    newStageName,
    newStageColor,
    selectedConfigId,
    stages.length,
    onCreateStage,
  ]);

  // Save edited stage name
  const handleSaveStageEdit = useCallback(
    async (stageId: string) => {
      if (!editingStageName.trim()) return;
      await onUpdateStage(stageId, { name: editingStageName.trim() });
      setEditingStageId(null);
      setEditingStageName("");
    },
    [editingStageName, onUpdateStage]
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
      await onDeleteStage(deleteStageState.id);
      setDeleteStageState({ open: false, id: null, name: null });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStageState.id, onDeleteStage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {view === "list" ? (
          <>
            <DialogHeader>
              <DialogTitle>Stage Configurations</DialogTitle>
              <DialogDescription>
                Create and manage reusable stage setups for your{" "}
                {entityLabel.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>

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
                  {configs.map((config) => (
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
                        {config.id === assignedConfigId && (
                          <span className="text-primary text-xs">(active)</span>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleSelectConfig(config.id)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unassign button */}
            {assignedConfigId && (
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={handleUnassign}>
                  Remove Stage Assignment
                </Button>
              </DialogFooter>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
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
              </DialogTitle>
              <DialogDescription>
                Add, edit, and reorder stages in this configuration.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Add new stage */}
              <div className="space-y-2">
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
                    size="sm"
                  >
                    {isCreatingStage ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <PlusIcon className="size-4" />
                    )}
                  </Button>
                </div>

                {/* Color picker */}
                <div className="flex flex-wrap gap-1.5">
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
                </div>
              </div>

              <Separator />

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
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="hover:bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                    >
                      <GripVerticalIcon className="text-muted-foreground size-4 shrink-0" />

                      {/* Color dot */}
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            stage.color ?? "var(--muted-foreground)",
                        }}
                      />

                      {/* Name (editable or display) */}
                      {editingStageId === stage.id ? (
                        <div className="flex flex-1 items-center gap-1">
                          <Input
                            className="h-7 text-sm"
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

                          {/* Color picker for existing stage */}
                          <div className="flex items-center gap-0.5">
                            {STAGE_COLORS.slice(0, 6).map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`size-4 rounded-full border transition-all ${
                                  stage.color === color
                                    ? "border-foreground"
                                    : "hover:border-muted-foreground/50 border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  onUpdateStage(stage.id, { color })
                                }
                              />
                            ))}
                          </div>

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
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
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
            </DialogFooter>
          </>
        )}
      </DialogContent>

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
    </Dialog>
  );
}
