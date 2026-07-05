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
import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import { ContactEditor } from "@/components/contact-editor";
import { ContactList } from "@/components/contact-list";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useContacts, fetchContactById } from "@/hooks/use-contacts";
import { useDataExport } from "@/hooks/use-data-export";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTACT_CATEGORY_ID,
} from "@/lib/config/default-categories";
import {
  createContactDraftInput,
  createContactDraftSnapshot,
  isContactDraftUnchanged,
} from "@/lib/config/draft-defaults";
import { useEncryptionContext, decryptContactRow } from "@/lib/crypto";

import type { ContactDraftSnapshot } from "@/lib/config/draft-defaults";
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
    createWithId,
    seedDraft,
    removeDraft,
    remove,
    reorder,
    update,
  } = useContacts({ initialEncryptedData: initialEncryptedContacts });

  const {
    isOpen,
    entityId,
    openEntity,
    closePanel,
    openNewDraft,
    isOpeningDraft,
  } = useE2eeEntityPanelWithUrl("contact");

  const draftSnapshots = useRef<Map<string, ContactDraftSnapshot>>(new Map());

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
    entityId,
    entities: contacts,
    listIsLoading: isLoading,
    listError: error,
    isPersistingDraft: isOpeningDraft,
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

  const cleanupDraftIfUnchanged = useCallback(
    (id: string) => {
      const contact = contacts.find((c) => c.id === id);
      const snapshot = draftSnapshots.current.get(id);
      if (contact && snapshot && isContactDraftUnchanged(contact, snapshot)) {
        if (isOpeningDraft) {
          removeDraft(id);
        } else {
          void remove(id);
        }
      }
      draftSnapshots.current.delete(id);
    },
    [contacts, isOpeningDraft, remove, removeDraft]
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

  const onBeforeEntityChange = useCallback(
    (previousId: string) => {
      cleanupDraftIfUnchanged(previousId);
    },
    [cleanupDraftIfUnchanged]
  );

  useSyncE2eeEntityPanelFromUrl({
    paramKey: "contact",
    entityId,
    openEntity,
    closePanel,
    onBeforeEntityChange,
  });

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
    const draftInput = createContactDraftInput(DEFAULT_CONTACT_CATEGORY_ID);
    const snapshot = createContactDraftSnapshot(DEFAULT_CONTACT_CATEGORY_ID);
    const draftId = crypto.randomUUID();
    openNewDraft({
      id: draftId,
      seedOptimistic: (id) => {
        seedDraft(id, draftInput);
        draftSnapshots.current.set(id, snapshot);
      },
      persist: (id) => createWithId(id, draftInput),
      onPersistFailure: (id) => {
        removeDraft(id);
        draftSnapshots.current.delete(id);
      },
    });
  }, [
    cleanupDraftIfUnchanged,
    createWithId,
    entityId,
    openNewDraft,
    removeDraft,
    seedDraft,
  ]);

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteState({ open: true, id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
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
        {entityId ? (
          <ContactEditor
            key={entityId}
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
