"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { StageConfigurator } from "@/components/stage-configurator";
import { TaskCommandBar } from "@/components/task-command-bar";
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
  useUnits,
  useStageConfigs,
  useStages,
  useStageAssignment,
} from "@/hooks";

/**
 * Task Dashboard - Main view for Units list
 * Uses EntityList for list/table display with stage support and DnD
 */
export function TaskDashboard() {
  const router = useRouter();
  const { units, isLoading, error, create, remove, reorder } = useUnits();
  const {
    configs,
    create: createConfig,
    remove: removeConfig,
    update: updateConfig,
  } = useStageConfigs("unit");
  const { effectiveConfigId, assign, unassign } = useStageAssignment(
    "unit",
    null
  );
  const { stages } = useStages(effectiveConfigId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;

      setIsCreating(true);
      try {
        const result = await create({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
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
    [newTitle, newDescription, create]
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
      router.push(`/units/${entity.id}`);
    },
    [router]
  );

  return (
    <>
      <TaskCommandBar
        onConfigureStages={() => setIsConfiguratorOpen(true)}
        onCreateClick={() => setIsCreateOpen(true)}
        createLabel="New Unit"
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Units</h1>

        <EntityList
          entityType="unit"
          entities={units}
          isLoading={isLoading}
          error={error}
          stages={stages}
          onEntityClick={handleEntityClick}
          onEntityDelete={handleDeleteClick}
          onReorder={reorder}
          emptyTitle="No units yet"
          emptyDescription="Create your first unit to start organizing your tasks. All your data is encrypted and only you can read it."
        />
      </div>

      {/* Create Unit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Unit</DialogTitle>
              <DialogDescription>
                Create a new unit to organize your spaces and tasks. All data is
                encrypted end-to-end.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., My Organization"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Main workspace for my company"
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
                  "Create Unit"
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
        entityType="unit"
        configs={configs}
        assignedConfigId={effectiveConfigId}
        onCreateConfig={async (name) => createConfig({ name })}
        onDeleteConfig={removeConfig}
        onUpdateConfig={async (id, name) => updateConfig(id, { name })}
        onAssignConfig={assign}
        onUnassignConfig={unassign}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, id: null, name: null });
          }
        }}
        entityType="unit"
        entityName={deleteState.name ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
