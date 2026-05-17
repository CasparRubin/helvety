"use client";

import { ERROR_MESSAGES, TOAST_DURATIONS } from "@helvety/shared/constants";
import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { logger } from "@helvety/shared/logger";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import { E2eeEntityDetailSheet } from "@helvety/ui/e2ee-entity-detail-sheet";
import { EntityCommandBar } from "@helvety/ui/entity-command-bar";
import { EntityDashboardShell } from "@helvety/ui/entity-dashboard-shell";
import { ListSearchField } from "@helvety/ui/list-search-field";
import { useE2eeEntityPanelWithUrl } from "@helvety/ui/use-e2ee-entity-panel-with-url";
import { useSyncE2eeEntityPanelFromUrl } from "@helvety/ui/use-sync-e2ee-entity-panel-from-url";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { ContactEditor } from "@/components/contact-editor";
import { ContactList } from "@/components/contact-list";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useContacts } from "@/hooks/use-contacts";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTACT_CATEGORY_ID,
} from "@/lib/config/default-categories";
import {
  createContactDraftInput,
  createContactDraftSnapshot,
  isContactDraftUnchanged,
} from "@/lib/config/draft-defaults";
import { useEncryptionContext } from "@/lib/crypto";
import { downloadContactDataExport } from "@/lib/data-export";

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
    create,
    remove,
    reorder,
    patchLocal,
  } = useContacts({ initialEncryptedData: initialEncryptedContacts });

  const { isOpen, entityId, openEntity, closePanel, openNewDraft } =
    useE2eeEntityPanelWithUrl("contact");

  const draftSnapshots = useRef<Map<string, ContactDraftSnapshot>>(new Map());

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string | null;
    name: string | null;
  }>({ open: false, id: null, name: null });
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

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
  const selectedContact = useMemo(
    () =>
      entityId
        ? (contacts.find((contact) => contact.id === entityId) ?? null)
        : null,
    [contacts, entityId]
  );
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
        void remove(id);
      }
      draftSnapshots.current.delete(id);
    },
    [contacts, remove]
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
    const snapshot = createContactDraftSnapshot(DEFAULT_CONTACT_CATEGORY_ID);
    openNewDraft(async () => {
      const result = await create(
        createContactDraftInput(DEFAULT_CONTACT_CATEGORY_ID)
      );
      if (result) {
        draftSnapshots.current.set(result.id, snapshot);
      }
      return result;
    });
  }, [cleanupDraftIfUnchanged, create, entityId, openNewDraft]);

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

  const handleExportData = useCallback(() => {
    if (!masterKey) return;
    startExportTransition(async () => {
      try {
        await downloadContactDataExport(masterKey);
      } catch (error) {
        logger.logUnexpectedError("Data export failed", error);
        toast.error(ERROR_MESSAGES.EXPORT_FAILED, {
          duration: TOAST_DURATIONS.ERROR,
        });
      }
    });
  }, [masterKey, startExportTransition]);

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
        entityId={entityId}
      >
        {entityId ? (
          <ContactEditor
            key={entityId}
            contactId={entityId}
            initialContact={selectedContact ?? undefined}
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
        entityType="contact"
        entityName={deleteState.name ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
