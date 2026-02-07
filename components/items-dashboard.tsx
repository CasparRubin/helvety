"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { LabelConfiguratorContent } from "@/components/label-configurator";
import { SettingsPanel } from "@/components/settings-panel";
import { StageConfiguratorContent } from "@/components/stage-configurator";
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
  useSpace,
  useSpaces,
  useItems,
  useStageConfigs,
  useStages,
  useStageAssignment,
  useLabelConfigs,
  useLabels,
  useLabelAssignment,
} from "@/hooks";

/**
 * Items Dashboard - shows all items for a specific space
 */
export function ItemsDashboard({
  unitId,
  spaceId,
}: {
  unitId: string;
  spaceId: string;
}) {
  const router = useRouter();
  const { unit, isLoading: isLoadingUnit } = useUnit(unitId);
  const { space, isLoading: isLoadingSpace } = useSpace(spaceId);
  const { remove: removeSpace } = useSpaces(unitId);
  const { items, isLoading, error, refresh, create, remove, reorder } =
    useItems(spaceId);
  const {
    configs,
    create: createConfig,
    remove: removeConfig,
    update: updateConfig,
  } = useStageConfigs("item");
  const {
    effectiveConfigId: effectiveStageConfigId,
    assign: assignStage,
    unassign: unassignStage,
  } = useStageAssignment("item", spaceId);
  const { stages } = useStages(effectiveStageConfigId);

  // Label configuration hooks
  const {
    configs: labelConfigs,
    create: createLabelConfig,
    remove: removeLabelConfig,
    update: updateLabelConfig,
  } = useLabelConfigs();
  const {
    effectiveConfigId: effectiveLabelConfigId,
    assign: assignLabel,
    unassign: unassignLabel,
  } = useLabelAssignment(spaceId);
  const { labels } = useLabels(effectiveLabelConfigId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Item delete state (for individual items in the list)
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);
  // Space delete state (for deleting the parent space from command bar)
  const [isSpaceDeleteOpen, setIsSpaceDeleteOpen] = useState(false);
  const [isDeletingSpace, setIsDeletingSpace] = useState(false);
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
          space_id: spaceId,
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
    [newTitle, newDescription, create, spaceId, defaultStageId]
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

  const handleBack = useCallback(() => {
    router.push(`/units/${unitId}`);
  }, [router, unitId]);

  const handleEntityClick = useCallback(
    (entity: { id: string }) => {
      router.push(`/units/${unitId}/spaces/${spaceId}/items/${entity.id}`);
    },
    [router, unitId, spaceId]
  );

  const handleDeleteSpace = useCallback(() => {
    setIsSpaceDeleteOpen(true);
  }, []);

  const handleDeleteSpaceConfirm = useCallback(async () => {
    setIsDeletingSpace(true);
    try {
      await removeSpace(spaceId);
      router.push(`/units/${unitId}`);
    } finally {
      setIsDeletingSpace(false);
      setIsSpaceDeleteOpen(false);
    }
  }, [removeSpace, spaceId, unitId, router]);

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
        onCreateClick={() => setIsCreateOpen(true)}
        createLabel="New Item"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onSettings={() => setIsSettingsOpen(true)}
        onDelete={handleDeleteSpace}
        deleteLabel="Delete Space"
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
              <BreadcrumbLink asChild>
                <Link href={`/units/${unitId}`}>
                  {isLoadingUnit ? "..." : (unit?.title ?? "Unknown")}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isLoadingSpace ? "..." : (space?.title ?? "Unknown")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="mb-6 text-2xl font-semibold">Items</h1>

        <EntityList
          entityType="item"
          entities={items}
          isLoading={isLoading}
          error={error}
          stages={stages}
          labels={labels}
          onEntityClick={handleEntityClick}
          onEntityDelete={handleDeleteClick}
          onReorder={reorder}
        />
      </div>

      {/* Create Item Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Item</DialogTitle>
              <DialogDescription>
                Create a new item in this space. All data is encrypted
                end-to-end.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-title">Title</Label>
                <Input
                  id="item-title"
                  placeholder="e.g., Implement authentication"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-description">Description (optional)</Label>
                <Input
                  id="item-description"
                  placeholder="e.g., Add OAuth2 login flow"
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
                  "Create Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Panel */}
      <SettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        sections={[
          {
            id: "stages",
            label: "Stages",
            content: (
              <StageConfiguratorContent
                entityType="item"
                configs={configs}
                assignedConfigId={effectiveStageConfigId}
                onCreateConfig={async (name) => createConfig({ name })}
                onDeleteConfig={removeConfig}
                onUpdateConfig={async (id, name) => updateConfig(id, { name })}
                onAssignConfig={assignStage}
                onUnassignConfig={unassignStage}
              />
            ),
          },
          {
            id: "labels",
            label: "Labels",
            content: (
              <LabelConfiguratorContent
                configs={labelConfigs}
                assignedConfigId={effectiveLabelConfigId}
                onCreateConfig={async (name) => createLabelConfig({ name })}
                onDeleteConfig={removeLabelConfig}
                onUpdateConfig={async (id, name) =>
                  updateLabelConfig(id, { name })
                }
                onAssignConfig={assignLabel}
                onUnassignConfig={unassignLabel}
              />
            ),
          },
        ]}
      />

      {/* Delete Item Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, id: null, name: null });
          }
        }}
        entityType="item"
        entityName={deleteState.name ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Delete Space Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isSpaceDeleteOpen}
        onOpenChange={setIsSpaceDeleteOpen}
        entityType="space"
        entityName={space?.title}
        onConfirm={handleDeleteSpaceConfirm}
        isDeleting={isDeletingSpace}
      />
    </>
  );
}
