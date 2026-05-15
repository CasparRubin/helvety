"use client";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { Button } from "@helvety/ui/button";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
import { EntityDashboardShell } from "@helvety/ui/entity-dashboard-shell";
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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

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

/** Props for the tasks dashboard component. */
interface FlatTasksDashboardProps {
  initialEncryptedItems?: ItemRow[];
}

/** Tasks dashboard with list view, create dialog, and details sheet. */
export function FlatTasksDashboard({
  initialEncryptedItems,
}: FlatTasksDashboardProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const {
    items,
    isLoading,
    isRefreshing,
    error,
    refresh,
    create,
    remove,
    reorder,
    patchLocal,
  } = useItems({ initialEncryptedData: initialEncryptedItems });
  const { stages } = useStages(DEFAULT_STAGE_CONFIGS.item.id);
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isRefreshPending, startRefreshTransition] = useTransition();
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

  useEffect(() => {
    setSelectedItemId(searchParams.get("item"));
  }, [searchParams]);

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
    return filterE2eeDashboardItems(items, searchQuery, (item) => [
      item.title,
      getRichTextPlainText(item.description ?? "") ?? "",
    ]);
  }, [items, searchQuery]);

  const isSearchActive = searchQuery.trim() !== "";
  const emptySearchMessage = resolveE2eeEmptySearchMessage({
    searchQuery,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    emptyMessage: "No tasks match your search.",
  });

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
      <CommandBarPageLayout
        commandBar={
          <TaskCommandBar
            onCreateClick={() => setIsCreateOpen(true)}
            createLabel="New Task"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing || isRefreshPending}
            onExport={isUnlocked && masterKey ? handleExportData : undefined}
            isExporting={isExporting}
          />
        }
      >
        <EntityDashboardShell
          title="Tasks"
          searchField={
            <ListSearchField
              className="mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              aria-label="Search tasks"
            />
          }
          list={
            <EntityList
              entities={filteredItems}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
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
          }
        />
      </CommandBarPageLayout>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Create a new task. Title, description, and schedule fields are
                end-to-end encrypted. Stage, ordering, and related structural
                metadata stay plaintext so the board can group and sort tasks.
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
          className="flex w-full flex-col overflow-hidden sm:max-w-[95vw] 2xl:max-w-[1800px]"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {selectedItemId && selectedItem ? (
            <div className="min-h-0 flex-1">
              <ItemEditor
                itemId={selectedItemId}
                initialItem={selectedItem}
                embedded
                onClose={() => setSelectedItemId(null)}
                onLocalPatch={(id, input) => patchLocal(id, input)}
              />
            </div>
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
          const deleteId = deleteState.id;
          if (!deleteId) return;
          startDeleteTransition(async () => {
            await remove(deleteId);
            setDeleteState({ open: false, id: null, name: null });
          });
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
