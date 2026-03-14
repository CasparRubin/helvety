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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { ItemEditor } from "@/components/item-editor";
import { NoteCommandBar } from "@/components/note-command-bar";
import { useDataExport } from "@/hooks/use-data-export";
import { useItems } from "@/hooks/use-items";
import { useEncryptionContext } from "@/lib/crypto";

import type { ItemRow } from "@/lib/types";

/** Props for the flat notes dashboard. */
interface FlatNotesDashboardProps {
  initialEncryptedItems?: ItemRow[];
}

/** Flat `/notes` dashboard with item list and sheet detail editor. */
export function FlatNotesDashboard({
  initialEncryptedItems,
}: FlatNotesDashboardProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const { isUnlocked, masterKey } = useEncryptionContext();
  const { items, isLoading, error, refresh, create, remove, reorder } =
    useItems({ initialEncryptedData: initialEncryptedItems });
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    // Prefer the canonical `note` query param used by cross-app deep links.
    return searchParams.get("note") ?? searchParams.get("item");
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;

      startCreateTransition(async () => {
        const result = await create({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        });

        if (result) {
          setNewTitle("");
          setNewDescription("");
          setIsCreateOpen(false);
        }
      });
    },
    [newTitle, newDescription, create]
  );

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  return (
    <>
      <NoteCommandBar
        onCreateClick={() => setIsCreateOpen(true)}
        createLabel="New Note"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Notes</h1>

        <EntityList
          entities={items}
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
          stages={[]}
          onEntityClick={(entity) => setSelectedItemId(entity.id)}
          onEntityDelete={(id, title) =>
            setDeleteState({ open: true, id, name: title })
          }
          onReorder={reorder}
        />
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
              <DialogDescription>
                Create a new note. Sensitive content fields are end-to-end
                encrypted; some structural metadata remains unencrypted for app
                functionality.
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
                  "Create Note"
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
            <SheetTitle>Note Details</SheetTitle>
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
