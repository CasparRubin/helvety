"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@helvety/ui/breadcrumb";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import { ContactLinksPanel } from "@/components/contact-links-panel";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { TaskCommandBar } from "@/components/task-command-bar";
import { useDataExport } from "@/hooks/use-data-export";
import { useItems } from "@/hooks/use-items";
import { useLabels } from "@/hooks/use-labels";
import { useRouteInstanceGuard } from "@/hooks/use-route-instance-guard";
import { useSpace, useSpaces } from "@/hooks/use-spaces";
import { useStages } from "@/hooks/use-stages";
import { useUnit } from "@/hooks/use-units";
import { DEFAULT_LABEL_CONFIG } from "@/lib/config/default-labels";
import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";
import { useEncryptionContext } from "@/lib/crypto";

import type { ItemRow, SpaceRow, UnitRow } from "@/lib/types";

/**
 * Items Dashboard - shows all items for a specific space
 */
export function ItemsDashboard({
  unitId,
  spaceId,
  initialEncryptedUnit,
  initialEncryptedSpace,
  initialEncryptedItems,
}: {
  unitId: string;
  spaceId: string;
  initialEncryptedUnit?: UnitRow;
  initialEncryptedSpace?: SpaceRow;
  initialEncryptedItems?: ItemRow[];
}) {
  const router = useRouter();
  const { canNavigate } = useRouteInstanceGuard();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const { unit, isLoading: isLoadingUnit } = useUnit(unitId, {
    initialEncryptedData: initialEncryptedUnit,
  });
  const {
    space,
    isLoading: isLoadingSpace,
    update: updateSpace,
  } = useSpace(spaceId, { initialEncryptedData: initialEncryptedSpace });
  const { remove: removeSpace } = useSpaces(unitId);
  const { items, isLoading, error, refresh, create, remove, reorder } =
    useItems(spaceId, { initialEncryptedData: initialEncryptedItems });
  const { stages } = useStages(DEFAULT_STAGE_CONFIGS.item.id);
  const { labels } = useLabels(DEFAULT_LABEL_CONFIG.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  // Item delete state (for individual items in the list)
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);
  // Space edit state (for editing the parent space from command bar)
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);
  const [editSpaceTitle, setEditSpaceTitle] = useState("");
  const [editSpaceDescription, setEditSpaceDescription] = useState("");
  const [isUpdatingSpace, setIsUpdatingSpace] = useState(false);
  // Space delete state (for deleting the parent space from command bar)
  const [isSpaceDeleteOpen, setIsSpaceDeleteOpen] = useState(false);
  const [isDeletingSpace, setIsDeletingSpace] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    router.replace(`/units/${unitId}`);
  }, [router, unitId]);

  const getEntityHref = useCallback(
    (entity: { id: string }) => {
      return `/units/${unitId}/spaces/${spaceId}/items/${entity.id}`;
    },
    [unitId, spaceId]
  );

  const handleEditSpaceOpen = useCallback(() => {
    setEditSpaceTitle(space?.title ?? "");
    setEditSpaceDescription(space?.description ?? "");
    setIsEditSpaceOpen(true);
  }, [space]);

  const handleEditSpaceSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editSpaceTitle.trim()) return;

      setIsUpdatingSpace(true);
      try {
        const success = await updateSpace({
          title: editSpaceTitle.trim(),
          description: editSpaceDescription.trim() || null,
        });

        if (success) {
          setIsEditSpaceOpen(false);
        }
      } finally {
        setIsUpdatingSpace(false);
      }
    },
    [editSpaceTitle, editSpaceDescription, updateSpace]
  );

  const handleDeleteSpace = useCallback(() => {
    setIsSpaceDeleteOpen(true);
  }, []);

  const handleDeleteSpaceConfirm = useCallback(async () => {
    setIsDeletingSpace(true);
    try {
      await removeSpace(spaceId);
      if (canNavigate()) {
        router.replace(`/units/${unitId}`);
      }
    } finally {
      setIsDeletingSpace(false);
      setIsSpaceDeleteOpen(false);
    }
  }, [removeSpace, spaceId, unitId, router, canNavigate]);

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
        onEdit={handleEditSpaceOpen}
        editLabel="Edit Space"
        onDelete={handleDeleteSpace}
        deleteLabel="Delete Space"
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
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
          onRetry={refresh}
          stages={stages}
          labels={labels}
          entityHref={getEntityHref}
          onEntityDelete={handleDeleteClick}
          onReorder={reorder}
        />

        {/* Linked Contacts */}
        <div className="mt-8">
          <ContactLinksPanel entityType="space" entityId={spaceId} />
        </div>
      </div>

      {/* Create Item Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Item</DialogTitle>
              <DialogDescription>
                Create a new item in this space. Sensitive content fields are
                end-to-end encrypted; some structural metadata remains
                unencrypted for app functionality.
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

      {/* Edit Space Dialog */}
      <Dialog open={isEditSpaceOpen} onOpenChange={setIsEditSpaceOpen}>
        <DialogContent>
          <form onSubmit={handleEditSpaceSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Space</DialogTitle>
              <DialogDescription>
                Update the space name and description. Sensitive content fields
                are end-to-end encrypted; some structural metadata remains
                unencrypted for app functionality.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-space-title">Title</Label>
                <Input
                  id="edit-space-title"
                  placeholder="e.g., Backend, Frontend, Design"
                  value={editSpaceTitle}
                  onChange={(e) => setEditSpaceTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-space-description">
                  Description (optional)
                </Label>
                <Input
                  id="edit-space-description"
                  placeholder="e.g., Backend development tasks"
                  value={editSpaceDescription}
                  onChange={(e) => setEditSpaceDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditSpaceOpen(false)}
                disabled={isUpdatingSpace}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingSpace || !editSpaceTitle.trim()}
              >
                {isUpdatingSpace ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
