"use client";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import { E2eeEntityDetailSheet } from "@helvety/ui/e2ee-entity-detail-sheet";
import { EntityCommandBar } from "@helvety/ui/entity-command-bar";
import { EntityDashboardShell } from "@helvety/ui/entity-dashboard-shell";
import { ListSearchField } from "@helvety/ui/list-search-field";
import { getRichTextPlainText } from "@helvety/ui/tiptap-utils";
import { useE2eeEntityPanelWithUrl } from "@helvety/ui/use-e2ee-entity-panel-with-url";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { ItemEditor } from "@/components/item-editor";
import { useDataExport } from "@/hooks/use-data-export";
import { useItems } from "@/hooks/use-items";
import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";
import {
  createNoteDraftInput,
  createNoteDraftSnapshot,
  isNoteDraftUnchanged,
} from "@/lib/config/draft-defaults";
import { useEncryptionContext } from "@/lib/crypto";

import type { NoteDraftSnapshot } from "@/lib/config/draft-defaults";
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

  const { isOpen, entityId, openEntity, closePanel, openNewDraft } =
    useE2eeEntityPanelWithUrl("note", { legacyParamKeys: ["item"] });

  const draftSnapshots = useRef<Map<string, NoteDraftSnapshot>>(new Map());

  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedItem = useMemo(
    () =>
      entityId ? (items.find((item) => item.id === entityId) ?? null) : null,
    [items, entityId]
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

  const cleanupDraftIfUnchanged = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      const snapshot = draftSnapshots.current.get(id);
      if (item && snapshot && isNoteDraftUnchanged(item, snapshot)) {
        void remove(id);
      }
      draftSnapshots.current.delete(id);
    },
    [items, remove]
  );

  const handleSelectEntity = useCallback(
    (id: string) => {
      if (entityId && entityId !== id) {
        cleanupDraftIfUnchanged(entityId);
      }
      openEntity(id);
    },
    [cleanupDraftIfUnchanged, entityId, openEntity]
  );

  const entityIdRef = useRef(entityId);
  entityIdRef.current = entityId;

  useEffect(() => {
    const id = searchParams.get("note") ?? searchParams.get("item");
    if (id) {
      handleSelectEntity(id);
      return;
    }
    const currentId = entityIdRef.current;
    if (currentId) {
      cleanupDraftIfUnchanged(currentId);
    }
    closePanel();
  }, [searchParams, handleSelectEntity, cleanupDraftIfUnchanged, closePanel]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        return;
      }
      if (entityId) {
        cleanupDraftIfUnchanged(entityId);
      }
      closePanel();
    },
    [cleanupDraftIfUnchanged, closePanel, entityId]
  );

  const handleCreateClick = useCallback(() => {
    if (entityId) {
      cleanupDraftIfUnchanged(entityId);
    }
    const snapshot = createNoteDraftSnapshot(defaultCategoryId);
    openNewDraft(async () => {
      const result = await create(createNoteDraftInput(defaultCategoryId));
      if (result) {
        draftSnapshots.current.set(result.id, snapshot);
      }
      return result;
    });
  }, [
    cleanupDraftIfUnchanged,
    create,
    defaultCategoryId,
    entityId,
    openNewDraft,
  ]);

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  return (
    <>
      <CommandBarPageLayout
        commandBar={
          <EntityCommandBar
            onCreateClick={handleCreateClick}
            createLabel="New Note"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing || isRefreshPending}
            onExport={isUnlocked && masterKey ? handleExportData : undefined}
            isExporting={isExporting}
          />
        }
      >
        <EntityDashboardShell
          title="Notes"
          searchField={
            <ListSearchField
              className="mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
            />
          }
          list={
            <EntityList
              entities={filteredItems}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              error={error}
              onRetry={refresh}
              categories={DEFAULT_NOTE_CATEGORIES}
              onEntityClick={(entity) => handleSelectEntity(entity.id)}
              onEntityDelete={(id, title) =>
                setDeleteState({ open: true, id, name: title })
              }
              onReorder={isSearchActive ? undefined : reorder}
              emptySearchMessage={emptySearchMessage}
            />
          }
        />
      </CommandBarPageLayout>

      <E2eeEntityDetailSheet
        open={isOpen}
        onOpenChange={handleSheetOpenChange}
        title="Note Details"
        entityId={entityId}
      >
        {entityId ? (
          <ItemEditor
            key={entityId}
            itemId={entityId}
            initialItem={selectedItem ?? undefined}
            embedded
            onClose={() => handleSheetOpenChange(false)}
            onLocalPatch={(id, input) => patchLocal(id, input)}
          />
        ) : null}
      </E2eeEntityDetailSheet>

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
            draftSnapshots.current.delete(deleteId);
            await remove(deleteId);
            if (entityId === deleteId) {
              closePanel();
            }
            setDeleteState({ open: false, id: null, name: null });
          });
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
