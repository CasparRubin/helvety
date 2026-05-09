"use client";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
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
import { NoteCommandBar } from "@/components/note-command-bar";
import { useDataExport } from "@/hooks/use-data-export";
import { useItems } from "@/hooks/use-items";
import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";
import { useEncryptionContext } from "@/lib/crypto";

import type { ItemRow } from "@/lib/types";

/** Props for the main `/notes` dashboard (category-grouped list + sheet editor). */
interface FlatNotesDashboardProps {
  initialEncryptedItems?: ItemRow[];
}

/** `/notes` dashboard: notes grouped by fixed categories, sheet detail editor. */
export function FlatNotesDashboard({
  initialEncryptedItems,
}: FlatNotesDashboardProps): React.JSX.Element {
  const defaultCategoryId = DEFAULT_NOTE_CATEGORIES[0]?.id ?? "";
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
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(defaultCategoryId);
  const [isRefreshPending, startRefreshTransition] = useTransition();
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedItemId(searchParams.get("note") ?? searchParams.get("item"));
  }, [searchParams]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const searchableContentById = useMemo(() => {
    const index = new Map<string, string>();
    for (const item of items) {
      index.set(item.id, getRichTextPlainText(item.description ?? "") ?? "");
    }
    return index;
  }, [items]);

  const filteredItems = useMemo(() => {
    return filterE2eeDashboardItems(items, searchQuery, (item) => [
      item.title,
      searchableContentById.get(item.id) ?? "",
    ]);
  }, [items, searchableContentById, searchQuery]);

  const isSearchActive = searchQuery.trim() !== "";
  const emptySearchMessage = resolveE2eeEmptySearchMessage({
    searchQuery,
    totalCount: items.length,
    filteredCount: filteredItems.length,
    emptyMessage: "No notes match your search.",
  });

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;

      startCreateTransition(async () => {
        const result = await create({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          category_id: newCategoryId,
        });

        if (result) {
          setNewTitle("");
          setNewDescription("");
          setNewCategoryId(defaultCategoryId);
          setIsCreateOpen(false);
        }
      });
    },
    [newTitle, newDescription, newCategoryId, create, defaultCategoryId]
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
        isRefreshing={isRefreshing || isRefreshPending}
        onExport={isUnlocked && masterKey ? handleExportData : undefined}
        isExporting={isExporting}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Notes</h1>

        <ListSearchField
          className="mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes…"
          aria-label="Search notes"
        />

        <EntityList
          entities={filteredItems}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          onRetry={refresh}
          categories={DEFAULT_NOTE_CATEGORIES}
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
              <DialogTitle>Create Note</DialogTitle>
              <DialogDescription>
                Create a new note. Title and description are end-to-end
                encrypted. Category (Personal, Work, Other) and ordering stay
                plaintext so the app can group and sort your list.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-title">Title</Label>
                <Input
                  id="item-title"
                  placeholder="e.g., Meeting notes - Q2 planning"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-description">Description (optional)</Label>
                <Input
                  id="item-description"
                  placeholder="e.g., Decisions, follow-ups, and open questions"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note-category">Category</Label>
                <select
                  id="note-category"
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                >
                  {DEFAULT_NOTE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
              initialItem={selectedItem}
              embedded
              onClose={() => setSelectedItemId(null)}
              onLocalPatch={(id, input) => patchLocal(id, input)}
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
