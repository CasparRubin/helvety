"use client";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { Button } from "@helvety/ui/button";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import { EntityDashboardShell } from "@helvety/ui/entity-dashboard-shell";
import { ListSearchField } from "@helvety/ui/list-search-field";
import {
  ListEmptyState,
  ListErrorState,
  ListLoadingState,
} from "@helvety/ui/list-states";
import { Pencil } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { FolderCreateSheet } from "@/components/folder-create-sheet";
import { FolderEditorSheet } from "@/components/folder-editor-sheet";
import { LinkCreateSheet } from "@/components/link-create-sheet";
import { LinkEditorSheet } from "@/components/link-editor-sheet";
import { LinksCommandBar } from "@/components/links-command-bar";
import { LinksTreeList } from "@/components/links-tree-list";
import { useDataExport } from "@/hooks/use-data-export";
import { useLinkLibrary } from "@/hooks/use-link-library";
import { useEncryptionContext } from "@/lib/crypto";
import { formatFolderPath } from "@/lib/link-tree";

import type { Link, LinkFolderRow, LinkRow } from "@/lib/types";

/** Props for the links dashboard page client. */
interface LinksDashboardProps {
  initialEncryptedFolders?: LinkFolderRow[];
  initialEncryptedLinks?: LinkRow[];
}

/** Main links dashboard: command bar, search, nested tree, and create/edit sheets. */
export function LinksDashboard({
  initialEncryptedFolders,
  initialEncryptedLinks,
}: LinksDashboardProps): React.JSX.Element {
  const { isUnlocked, masterKey } = useEncryptionContext();
  const library = useLinkLibrary({
    initialEncryptedFolders,
    initialEncryptedLinks,
  });
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set()
  );
  const [createParentFolderId, setCreateParentFolderId] = useState<
    string | null
  >(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    type: "folder" | "link" | null;
    id: string | null;
    name: string | null;
  }>({ open: false, type: null, id: null, name: null });

  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();

  const openCreateLink = useCallback(() => {
    setEditingLinkId(null);
    setEditingFolderId(null);
    setIsCreateFolderOpen(false);
    setIsCreateLinkOpen(true);
  }, []);

  const openCreateFolder = useCallback(() => {
    setEditingLinkId(null);
    setEditingFolderId(null);
    setIsCreateLinkOpen(false);
    setIsCreateFolderOpen(true);
  }, []);

  const openEditLink = useCallback((linkId: string) => {
    setIsCreateLinkOpen(false);
    setIsCreateFolderOpen(false);
    setEditingFolderId(null);
    setEditingLinkId(linkId);
  }, []);

  const openEditFolder = useCallback((folderId: string) => {
    setIsCreateLinkOpen(false);
    setIsCreateFolderOpen(false);
    setEditingLinkId(null);
    setEditingFolderId(folderId);
  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
    setCreateParentFolderId(folderId);
  }, []);

  const expandFolder = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      if (prev.has(folderId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  }, []);

  const createParentFolderName = useMemo(() => {
    if (!createParentFolderId) {
      return null;
    }
    return (
      library.folders.find((f) => f.id === createParentFolderId)?.name ?? null
    );
  }, [createParentFolderId, library.folders]);

  const editingLink = useMemo(
    () => library.links.find((l) => l.id === editingLinkId) ?? null,
    [library.links, editingLinkId]
  );

  const editingFolder = useMemo(
    () => library.folders.find((f) => f.id === editingFolderId) ?? null,
    [library.folders, editingFolderId]
  );

  const searchActive = searchQuery.trim().length > 0;

  const filteredLinks = useMemo(() => {
    if (!searchActive) {
      return [];
    }
    return filterE2eeDashboardItems(library.links, searchQuery, (link) => [
      link.name,
      link.url,
      formatFolderPath(library.folders, link.folder_id),
    ]);
  }, [library.folders, library.links, searchActive, searchQuery]);

  const handleRefresh = () => {
    startRefreshTransition(() => {
      void library.refresh();
    });
  };

  const handleCreateFolder = (input: {
    name: string;
    parent_folder_id: string | null;
  }) => {
    startCreateTransition(async () => {
      const created = await library.createFolder(
        { name: input.name },
        input.parent_folder_id
      );
      if (created) {
        if (input.parent_folder_id) {
          expandFolder(input.parent_folder_id);
        }
        setCreateParentFolderId(input.parent_folder_id);
        setIsCreateFolderOpen(false);
      }
    });
  };

  const handleCreateLink = (input: {
    url: string;
    name: string;
    folder_id: string | null;
  }) => {
    startCreateTransition(async () => {
      const created = await library.createLink(
        { name: input.name, url: input.url },
        input.folder_id
      );
      if (created) {
        if (input.folder_id) {
          expandFolder(input.folder_id);
          setCreateParentFolderId(input.folder_id);
        }
        setIsCreateLinkOpen(false);
      }
    });
  };

  const handleConfirmDelete = () => {
    const targetId = deleteState.id;
    const targetType = deleteState.type;
    if (!targetId || !targetType) {
      return;
    }
    startDeleteTransition(async () => {
      if (targetType === "folder") {
        await library.removeFolder(targetId);
        setExpandedFolderIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        if (createParentFolderId === targetId) {
          setCreateParentFolderId(null);
        }
        if (editingFolderId === targetId) {
          setEditingFolderId(null);
        }
      } else {
        await library.removeLink(targetId);
        if (editingLinkId === targetId) {
          setEditingLinkId(null);
        }
      }
      setDeleteState({ open: false, type: null, id: null, name: null });
    });
  };

  const emptySearchMessage = resolveE2eeEmptySearchMessage({
    searchQuery,
    totalCount: library.links.length,
    filteredCount: filteredLinks.length,
    emptyMessage: "No links match your search",
  });

  return (
    <>
      <CommandBarPageLayout
        commandBar={
          <LinksCommandBar
            onCreateClick={openCreateLink}
            createLabel="New link"
            onCreateFolderClick={openCreateFolder}
            onRefresh={handleRefresh}
            isRefreshing={library.isRefreshing || isRefreshPending}
            onExport={handleExportData}
            isExporting={isExporting}
          />
        }
      >
        <EntityDashboardShell
          title="Links"
          searchField={
            isUnlocked ? (
              <ListSearchField
                className="mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search links…"
                aria-label="Search links"
              />
            ) : null
          }
          list={
            library.isLoading ? (
              <ListLoadingState />
            ) : library.error ? (
              <ListErrorState
                message={library.error}
                onRetry={library.refresh}
              />
            ) : !isUnlocked ? (
              <ListEmptyState
                title="Locked"
                description="Unlock encryption with your passkey to view bookmarks."
              />
            ) : searchActive ? (
              <ul className="divide-border divide-y rounded-lg border">
                {emptySearchMessage ? (
                  <li className="text-muted-foreground p-4 text-sm">
                    {emptySearchMessage}
                  </li>
                ) : filteredLinks.length === 0 ? (
                  <li className="text-muted-foreground p-4 text-sm">
                    No links match your search
                  </li>
                ) : (
                  filteredLinks.map((link) => (
                    <li key={link.id}>
                      <SearchResultRow
                        link={link}
                        sublabel={formatFolderPath(
                          library.folders,
                          link.folder_id
                        )}
                        onOpen={() =>
                          window.open(link.url, "_blank", "noopener,noreferrer")
                        }
                        onEdit={() => openEditLink(link.id)}
                      />
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <LinksTreeList
                folders={library.folders}
                links={library.links}
                expandedFolderIds={expandedFolderIds}
                onToggleFolder={toggleFolder}
                onEditLink={openEditLink}
                onEditFolder={openEditFolder}
                onTreeDrop={library.applyTreeDrop}
                onExpandFolder={expandFolder}
                sortableDisabled={searchActive}
              />
            )
          }
        />
      </CommandBarPageLayout>

      <LinkCreateSheet
        open={isCreateLinkOpen}
        folders={library.folders}
        defaultFolderId={createParentFolderId}
        parentFolderName={createParentFolderName}
        isCreating={isCreatePending}
        onOpenChange={setIsCreateLinkOpen}
        onCreate={handleCreateLink}
      />

      <FolderCreateSheet
        open={isCreateFolderOpen}
        folders={library.folders}
        defaultParentFolderId={createParentFolderId}
        isCreating={isCreatePending}
        onOpenChange={setIsCreateFolderOpen}
        onCreate={handleCreateFolder}
      />

      <LinkEditorSheet
        open={editingLinkId !== null}
        link={editingLink}
        folders={library.folders}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLinkId(null);
          }
        }}
        isSaving={isSavePending}
        isDeleting={isDeletePending}
        onDelete={
          editingLink
            ? () =>
                setDeleteState({
                  open: true,
                  type: "link",
                  id: editingLink.id,
                  name: editingLink.name,
                })
            : undefined
        }
        onSave={(input) => {
          if (!editingLink) {
            return Promise.resolve(false);
          }
          return new Promise((resolve) => {
            startSaveTransition(async () => {
              const ok = await library.updateLink(editingLink.id, input);
              if (ok) {
                setEditingLinkId(null);
              }
              resolve(ok);
            });
          });
        }}
      />

      <FolderEditorSheet
        open={editingFolderId !== null}
        folder={editingFolder}
        folders={library.folders}
        onOpenChange={(open) => {
          if (!open) {
            setEditingFolderId(null);
          }
        }}
        isSaving={isSavePending}
        isDeleting={isDeletePending}
        onDelete={
          editingFolder
            ? () =>
                setDeleteState({
                  open: true,
                  type: "folder",
                  id: editingFolder.id,
                  name: editingFolder.name,
                })
            : undefined
        }
        onSave={(input) => {
          if (!editingFolder) {
            return Promise.resolve(false);
          }
          return new Promise((resolve) => {
            startSaveTransition(async () => {
              const ok = await library.updateFolder(editingFolder.id, input);
              if (ok) {
                setEditingFolderId(null);
              }
              resolve(ok);
            });
          });
        }}
      />

      <DeleteConfirmationDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false, type: null, id: null, name: null });
          }
        }}
        entityType={deleteState.type ?? "link"}
        entityName={deleteState.name ?? undefined}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletePending}
      />
    </>
  );
}

/**
 *
 */
function SearchResultRow({
  link,
  sublabel,
  onOpen,
  onEdit,
}: {
  link: Link;
  sublabel?: string;
  onOpen: () => void;
  onEdit: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 overflow-hidden px-3 py-2.5">
      <button
        type="button"
        className="hover:bg-muted/50 flex min-w-0 flex-1 flex-col rounded-md px-1 py-0.5 text-left"
        onClick={onOpen}
      >
        <span className="truncate font-medium">{link.name}</span>
        {sublabel ? (
          <span className="text-muted-foreground truncate text-xs">
            {sublabel}
          </span>
        ) : null}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground shrink-0"
        aria-label={`Edit link ${link.name}`}
        onClick={onEdit}
      >
        <Pencil className="size-4" />
      </Button>
    </div>
  );
}
