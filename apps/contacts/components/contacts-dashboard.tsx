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
import { useE2eeDashboardSelectedEntity } from "@helvety/ui/use-e2ee-dashboard-selected-entity";
import { useE2eeEntityPanelWithUrl } from "@helvety/ui/use-e2ee-entity-panel-with-url";
import { useSyncE2eeEntityPanelFromUrl } from "@helvety/ui/use-sync-e2ee-entity-panel-from-url";
import { useCallback, useMemo, useState, useTransition } from "react";

import { ContactEditor } from "@/components/contact-editor";
import { ContactList } from "@/components/contact-list";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useContacts, fetchContactById } from "@/hooks/use-contacts";
import { useDataExport } from "@/hooks/use-data-export";
import { DEFAULT_CATEGORIES } from "@/lib/config/default-categories";
import { useEncryptionContext, decryptContactRow } from "@/lib/crypto";

import type { ContactRow } from "@/lib/types";

/** Props for the main contacts dashboard component. */
interface ContactsDashboardProps {
  /** Server-prefetched encrypted contacts to skip initial round-trip */
  initialEncryptedContacts?: ContactRow[];
}

/** Contacts dashboard with list and side-sheet editor. */
export function ContactsDashboard({
  initialEncryptedContacts,
}: ContactsDashboardProps = {}) {
  const { isUnlocked, masterKey } = useEncryptionContext();
  const {
    contacts,
    isLoading,
    isRefreshing,
    error,
    refresh,
    create,
    remove,
    reorder,
    update,
  } = useContacts({ initialEncryptedData: initialEncryptedContacts });

  const { isOpen, formMode, entityId, openEntity, closePanel, openCreate } =
    useE2eeEntityPanelWithUrl("contact");

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const filteredContacts = useMemo(() => {
    return filterE2eeDashboardItems(contacts, searchQuery, (contact) => [
      contact.first_name,
      contact.last_name,
      contact.email ?? "",
      contact.description ?? "",
      contact.notes ?? "",
    ]);
  }, [contacts, searchQuery]);

  const isSearchActive = searchQuery.trim() !== "";
  const {
    entity: selectedContact,
    isLoadingEntity,
    entityError,
  } = useE2eeDashboardSelectedEntity({
    entityId: formMode === "edit" ? entityId : null,
    entities: contacts,
    listIsLoading: isLoading,
    listError: error,
    masterKey,
    isUnlocked,
    navigationSource: "contacts-dashboard",
    loadFailureMessage: "Failed to load contact",
    fetchById: fetchContactById,
    decryptRow: decryptContactRow,
  });
  const emptySearchMessage = resolveE2eeEmptySearchMessage({
    searchQuery,
    totalCount: contacts.length,
    filteredCount: filteredContacts.length,
    emptyMessage: "No contacts match your search.",
  });

  const handleSelectEntity = useCallback(
    (id: string) => {
      openEntity(id);
    },
    [openEntity]
  );

  useSyncE2eeEntityPanelFromUrl({
    paramKey: "contact",
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

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    const deleteId = deleteState.id;
    if (!deleteId) return;
    startDeleteTransition(async () => {
      await remove(deleteId);
      if (entityId === deleteId) {
        closePanel();
      }
      setDeleteState({ open: false, id: null, name: null });
    });
  }, [closePanel, deleteState.id, entityId, remove, startDeleteTransition]);

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      await refresh();
    });
  }, [refresh, startRefreshTransition]);

  return (
    <>
      <CommandBarPageLayout
        commandBar={
          <EntityCommandBar
            onCreateClick={handleCreateClick}
            createLabel="New Contact"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing || isRefreshPending}
            onExport={isUnlocked && masterKey ? handleExportData : undefined}
            isExporting={isExporting}
          />
        }
      >
        <EntityDashboardShell
          title="Contacts"
          searchField={
            <ListSearchField
              className="mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts…"
              aria-label="Search contacts"
            />
          }
          list={
            <ContactList
              contacts={filteredContacts}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              error={error}
              onRetry={refresh}
              onContactClick={(contact) => handleSelectEntity(contact.id)}
              onContactDelete={handleDeleteClick}
              onReorder={isSearchActive ? undefined : reorder}
              categories={DEFAULT_CATEGORIES}
              emptySearchMessage={emptySearchMessage}
            />
          }
        />
      </CommandBarPageLayout>

      <E2eeEntityDetailSheet
        open={isOpen}
        onOpenChange={handleSheetOpenChange}
        title="Contact Details"
      >
        {formMode === "create" ? (
          <ContactEditor
            key="create"
            formMode="create"
            onCreate={create}
            onCreated={handleCreated}
            onClose={() => handleSheetOpenChange(false)}
          />
        ) : entityId ? (
          <ContactEditor
            key={entityId}
            formMode="edit"
            contactId={entityId}
            contact={selectedContact}
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
        entityType="contact"
        entityName={deleteState.name ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
