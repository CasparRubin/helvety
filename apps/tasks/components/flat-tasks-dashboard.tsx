"use client";

import { matchesClientSearch } from "@helvety/shared/client-search";
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
import { ListSearchField } from "@helvety/ui/list-search-field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { getRichTextPlainText } from "@helvety/ui/tiptap-utils";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { ItemEditor } from "@/components/item-editor";
import { TaskCommandBar } from "@/components/task-command-bar";
import { useDataExport } from "@/hooks/use-data-export";
import { useItems } from "@/hooks/use-items";
import { useStages } from "@/hooks/use-stages";
import { DEFAULT_STAGE_CONFIGS } from "@/lib/config/default-stages";
import { useEncryptionContext } from "@/lib/crypto";

import type { ItemRow } from "@/lib/types";

/** Props for the flat tasks dashboard. */
interface FlatTasksDashboardProps {
  initialEncryptedItems?: ItemRow[];
}

/** Flat `/tasks` dashboard with item list and sheet detail editor. */
export function FlatTasksDashboard({
  initialEncryptedItems,
}: FlatTasksDashboardProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const { items, isLoading, error, refresh, create, remove, reorder } =
    useItems({ initialEncryptedData: initialEncryptedItems });
  const { stages } = useStages(DEFAULT_STAGE_CONFIGS.item.id);
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() =>
    searchParams.get("item")
  );
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const defaultStageId =
    stages.length > 0
      ? stages.reduce(
          (min, s) => (s.sort_order < min.sort_order ? s : min),
          stages[0]!
        ).id
      : null;

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      matchesClientSearch(
        [item.title, getRichTextPlainText(item.description ?? "") ?? ""],
        searchQuery
      )
    );
  }, [items, searchQuery]);

  const isSearchActive = searchQuery.trim() !== "";
  const emptySearchMessage =
    isSearchActive && items.length > 0 && filteredItems.length === 0
      ? "No tasks match your search."
      : undefined;

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
    [newTitle, newDescription, create, defaultStageId]
  );

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  return (
    <>
      <TaskCommandBar
        onCreateClick={() => setIsCreateOpen(true)}
        createLabel="New Task"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Tasks</h1>

        <ListSearchField
          className="mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks…"
          aria-label="Search tasks"
        />

        <EntityList
          entities={filteredItems}
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
          stages={stages}
          onEntityClick={(entity) => setSelectedItemId(entity.id)}
          onEntityDelete={(id, title) =>
            setDeleteState({ open: true, id, name: title })
          }
          onReorder={isSearchActive ? undefined : reorder}
          emptySearchMessage={emptySearchMessage}
        />
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Create a new task. Sensitive content fields are end-to-end
                encrypted; some structural metadata remains unencrypted for app
                functionality.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-title">Title</Label>
                <Input
                  id="item-title"
                  placeholder="e.g., Renew domain before Friday"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-description">Description (optional)</Label>
                <Input
                  id="item-description"
                  placeholder="e.g., Check DNS configuration and SSL renewal"
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
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet
        open={selectedItemId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItemId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-[95vw] 2xl:max-w-[1800px]"
        >
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {selectedItemId && selectedItem ? (
            <ItemEditor
              itemId={selectedItemId}
              embedded
              onClose={() => setSelectedItemId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, id: null, name: null });
          }
        }}
        entityType="item"
        entityName={deleteState.name ?? undefined}
        onConfirm={() => {
          if (!deleteState.id) return;
          startDeleteTransition(async () => {
            await remove(deleteState.id!);
            setDeleteState({ open: false, id: null, name: null });
          });
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
