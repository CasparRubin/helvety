"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { StageConfigurator } from "@/components/stage-configurator";
import { TaskCommandBar } from "@/components/task-command-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import {
  useUnit,
  useUnits,
  useSpaces,
  useChildCounts,
  useStageConfigs,
  useStages,
  useStageAssignment,
} from "@/hooks";

/**
 * Spaces Dashboard - shows all spaces for a specific unit
 */
export function SpacesDashboard({ unitId }: { unitId: string }) {
  const router = useRouter();
  const { unit, isLoading: isLoadingUnit } = useUnit(unitId);
  const { remove: removeUnit } = useUnits();
  const { spaces, isLoading, error, refresh, create, remove, reorder } =
    useSpaces(unitId);
  const { counts: childCounts } = useChildCounts("space", unitId);
  const {
    configs,
    create: createConfig,
    remove: removeConfig,
    update: updateConfig,
  } = useStageConfigs("space");
  const { effectiveConfigId, assign, unassign } = useStageAssignment(
    "space",
    unitId
  );
  const { stages } = useStages(effectiveConfigId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  // Space delete state (for individual spaces in the list)
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);
  // Unit delete state (for deleting the parent unit from command bar)
  const [isUnitDeleteOpen, setIsUnitDeleteOpen] = useState(false);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get the first stage (lowest sort_order) as the default for new entities
  const defaultStageId =
    stages.length > 0
      ? stages.reduce(
          (min, s) => (s.sort_order < min.sort_order ? s : min),
          stages[0]!
        ).id
      : null;

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;

      setIsCreating(true);
      try {
        const result = await create({
          unit_id: unitId,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          stage_id: defaultStageId,
        });

        if (result) {
          setNewTitle("");
          setNewDescription("");
          setIsCreateOpen(false);
        }
      } finally {
        setIsCreating(false);
      }
    },
    [newTitle, newDescription, create, unitId, defaultStageId]
  );

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState.id) return;
    setIsDeleting(true);
    try {
      await remove(deleteState.id);
      setDeleteState({ open: false, id: null, name: null });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteState.id, remove]);

  const handleEntityClick = useCallback(
    (entity: { id: string }) => {
      router.push(`/units/${unitId}/spaces/${entity.id}`);
    },
    [router, unitId]
  );

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleDeleteUnit = useCallback(() => {
    setIsUnitDeleteOpen(true);
  }, []);

  const handleDeleteUnitConfirm = useCallback(async () => {
    setIsDeletingUnit(true);
    try {
      await removeUnit(unitId);
      router.push("/");
    } finally {
      setIsDeletingUnit(false);
      setIsUnitDeleteOpen(false);
    }
  }, [removeUnit, unitId, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  return (
    <>
      <TaskCommandBar
        onBack={handleBack}
        onConfigureStages={() => setIsConfiguratorOpen(true)}
        onCreateClick={() => setIsCreateOpen(true)}
        createLabel="New Space"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onDelete={handleDeleteUnit}
        deleteLabel="Delete Unit"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Units</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isLoadingUnit ? "..." : (unit?.title ?? "Unknown")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-6 text-2xl font-semibold">Spaces</h1>

        <EntityList
          entityType="space"
          entities={spaces}
          isLoading={isLoading}
          error={error}
          stages={stages}
          childCounts={childCounts}
          onEntityClick={handleEntityClick}
          onEntityDelete={handleDeleteClick}
          onReorder={reorder}
        />
      </div>

      {/* Create Space Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Space</DialogTitle>
              <DialogDescription>
                Create a new space within this unit. All data is encrypted
                end-to-end.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="space-title">Title</Label>
                <Input
                  id="space-title"
                  placeholder="e.g., Backend, Frontend, Design"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="space-description">
                  Description (optional)
                </Label>
                <Input
                  id="space-description"
                  placeholder="e.g., Backend development tasks"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newTitle.trim()}>
                {isCreating ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Space"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stage Configurator */}
      <StageConfigurator
        open={isConfiguratorOpen}
        onOpenChange={setIsConfiguratorOpen}
        entityType="space"
        configs={configs}
        assignedConfigId={effectiveConfigId}
        onCreateConfig={async (name) => createConfig({ name })}
        onDeleteConfig={removeConfig}
        onUpdateConfig={async (id, name) => updateConfig(id, { name })}
        onAssignConfig={assign}
        onUnassignConfig={unassign}
      />

      {/* Delete Space Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, id: null, name: null });
          }
        }}
        entityType="space"
        entityName={deleteState.name ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Delete Unit Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isUnitDeleteOpen}
        onOpenChange={setIsUnitDeleteOpen}
        entityType="unit"
        entityName={unit?.title}
        onConfirm={handleDeleteUnitConfirm}
        isDeleting={isDeletingUnit}
      />
    </>
  );
}
