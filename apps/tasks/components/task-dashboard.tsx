"use client";

import { Button } from "@helvety/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useTransition } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { TaskCommandBar } from "@/components/task-command-bar";
import { useChildCounts } from "@/hooks/use-child-counts";
import { useDataExport } from "@/hooks/use-data-export";
import { useStages } from "@/hooks/use-stages";
import { useUnits } from "@/hooks/use-units";
import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";
import { useEncryptionContext } from "@/lib/crypto";

import type { UnitRow } from "@/lib/types";

/** Props for the main task dashboard component. */
interface TaskDashboardProps {
  /** Server-prefetched encrypted units */
  initialEncryptedUnits?: UnitRow[];
  /** Server-prefetched space counts per unit */
  initialSpaceCounts?: Record<string, number>;
}

/**
 * Task Dashboard - Main view for Units list
 * Uses EntityList for list/table display with stage support and DnD
 */
export function TaskDashboard({
  initialEncryptedUnits,
  initialSpaceCounts,
}: TaskDashboardProps = {}) {
  const router = useRouter();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const { units, isLoading, error, refresh, create, remove, reorder } =
    useUnits({ initialEncryptedData: initialEncryptedUnits });
  const { counts: childCounts } = useChildCounts("unit", undefined, {
    initialData: initialSpaceCounts,
  });
  const { stages } = useStages(DEFAULT_STAGE_CONFIGS.unit.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const { isExporting, handleExportData } = useDataExport(masterKey);

  // Get the first stage (lowest sort_order) as the default for new entities
  const defaultStageId =
    stages.length > 0
      ? stages.reduce(
          (min, s) => (s.sort_order < min.sort_order ? s : min),
          stages[0]!
        ).id
      : null;

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;

      startCreateTransition(async () => {
        const result = await create({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          stage_id: defaultStageId,
        });

        if (result) {
          setNewTitle("");
          setNewDescription("");
          setIsCreateOpen(false);
        }
      });
    },
    [newTitle, newDescription, create, defaultStageId, startCreateTransition]
  );

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteState.id) return;
    startDeleteTransition(async () => {
      await remove(deleteState.id!);
      setDeleteState({ open: false, id: null, name: null });
    });
  }, [deleteState.id, remove, startDeleteTransition]);

  const handleEntityClick = useCallback(
    (entity: { id: string }) => {
      router.push(`/units/${entity.id}`);
    },
    [router]
  );

  const handleEntityPrefetch = useCallback(
    (entity: { id: string }) => {
      void router.prefetch(`/units/${entity.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh, startRefreshTransition]);

  return (
    <>
      <TaskCommandBar
        onCreateClick={() => setIsCreateOpen(true)}
        createLabel="New Unit"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Units</h1>

        <EntityList
          entityType="unit"
          entities={units}
          isLoading={isLoading}
          error={error}
          stages={stages}
          childCounts={childCounts}
          onEntityClick={handleEntityClick}
          onEntityPrefetch={handleEntityPrefetch}
          onEntityDelete={handleDeleteClick}
          onReorder={reorder}
        />
      </div>

      {/* Create Unit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Unit</DialogTitle>
              <DialogDescription>
                Create a new unit to organize your spaces and tasks. Sensitive
                content fields are end-to-end encrypted; some structural
                metadata remains unencrypted for app functionality.
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
