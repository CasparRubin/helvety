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
import { useE2eeDashboardSelectedEntity } from "@helvety/ui/use-e2ee-dashboard-selected-entity";
import { useE2eeEntityPanelWithUrl } from "@helvety/ui/use-e2ee-entity-panel-with-url";
import { useSyncE2eeEntityPanelFromUrl } from "@helvety/ui/use-sync-e2ee-entity-panel-from-url";
import { useCallback, useMemo, useState, useTransition } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { EntityList } from "@/components/entity-list";
import { ItemEditor } from "@/components/item-editor";
import { useDataExport } from "@/hooks/use-data-export";
import { useItems, fetchNoteById } from "@/hooks/use-items";
import { DEFAULT_NOTE_CATEGORIES } from "@/lib/config/default-note-categories";
import { useEncryptionContext, decryptItemRow } from "@/lib/crypto";

import type { ItemRow } from "@/lib/types";

/** Props for the main `/notes` dashboard (category-grouped list + sheet editor). */
interface FlatNotesDashboardProps {
  initialEncryptedItems?: ItemRow[];
}

/** `/notes` dashboard: notes grouped by fixed categories, sheet detail editor. */
export function FlatNotesDashboard({
  initialEncryptedItems,
}: FlatNotesDashboardProps): React.JSX.Element {
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
    update,
  } = useItems({ initialEncryptedData: initialEncryptedItems });
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const { isOpen, formMode, entityId, openEntity, closePanel, openCreate } =
    useE2eeEntityPanelWithUrl("note");

  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    entity: selectedItem,
    isLoadingEntity,
    entityError,
  } = useE2eeDashboardSelectedEntity({
    entityId: formMode === "edit" ? entityId : null,
    entities: items,
    listIsLoading: isLoading,
    listError: error,
    masterKey,
    isUnlocked,
    navigationSource: "notes-dashboard",
    loadFailureMessage: "Failed to load note",
    fetchById: fetchNoteById,
    decryptRow: decryptItemRow,
  });

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

  const handleSelectEntity = useCallback(
    (id: string) => {
      openEntity(id);
    },
    [openEntity]
  );

  useSyncE2eeEntityPanelFromUrl({
    paramKey: "note",
    entityId,
    formMode,
    openEntity,
    closePanel,
  });

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        return;
      }
      closePanel();
    },
    [closePanel]
  );

  const handleCreateClick = useCallback(() => {
    openCreate();
  }, [openCreate]);

  const handleCreated = useCallback(
    (id: string) => {
      openEntity(id);
    },
    [openEntity]
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
      >
        {formMode === "create" ? (
          <ItemEditor
            key="create"
            formMode="create"
            onCreate={create}
            onCreated={handleCreated}
            onClose={() => handleSheetOpenChange(false)}
          />
        ) : entityId ? (
          <ItemEditor
            key={selectedItem ? entityId : `${entityId}-loading`}
            formMode="edit"
            itemId={entityId}
            item={selectedItem}
            isLoading={isLoadingEntity}
            error={entityError}
            onUpdate={(input) => update(entityId, input)}
            onRemove={() => remove(entityId)}
            onRefresh={refresh}
            onClose={() => handleSheetOpenChange(false)}
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
