"use client";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { Button } from "@helvety/ui/button";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
import { E2eeEntityDetailSheet } from "@helvety/ui/e2ee-entity-detail-sheet";
import { EntityDashboardShell } from "@helvety/ui/entity-dashboard-shell";
import { ListSearchField } from "@helvety/ui/list-search-field";
import {
  ListEmptyState,
  ListErrorState,
  ListLoadingState,
} from "@helvety/ui/list-states";
import { Pencil } from "lucide-react";
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
import { FolderEditor } from "@/components/folder-editor";
import { LinkEditor } from "@/components/link-editor";
import { LinksCommandBar } from "@/components/links-command-bar";
import { LinksTreeList } from "@/components/links-tree-list";
import { useDataExport } from "@/hooks/use-data-export";
import { useLinkLibrary } from "@/hooks/use-link-library";
import {
  useLinksPanelUrlSync,
  type LinksPanelState,
} from "@/hooks/use-links-panel-url";
import {
  ALL_FOLDER_ID,
  isAllFolderId,
  toStorageFolderId,
} from "@/lib/all-folder";
import {
  createFolderDraftSnapshot,
  createLinkDraftSnapshot,
  FOLDER_DRAFT_DEFAULT_NAME,
  isFolderDraftUnchanged,
  isLinkDraftUnchanged,
  LINK_DRAFT_DEFAULT_NAME,
  LINK_DRAFT_PLACEHOLDER_URL,
} from "@/lib/config/draft-defaults";
import { useEncryptionContext } from "@/lib/crypto";
import { formatFolderPath } from "@/lib/link-tree";
import { resolveLinkDisplayName } from "@/lib/url-normalize";

import type {
  FolderDraftSnapshot,
  LinkDraftSnapshot,
} from "@/lib/config/draft-defaults";
import type { Link, LinkFolderRow, LinkRow } from "@/lib/types";

/** Props for the links dashboard page client. */
interface LinksDashboardProps {
  initialEncryptedFolders?: LinkFolderRow[];
  initialEncryptedLinks?: LinkRow[];
}

/** Main links dashboard: command bar, search, nested tree, and entity detail sheet. */
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
  const searchParams = useSearchParams();
  const { readPanelFromUrl, writePanelToUrl } = useLinksPanelUrlSync();

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set([ALL_FOLDER_ID])
  );
  const [createParentFolderId, setCreateParentFolderId] = useState<
    string | null
  >(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [panel, setPanel] = useState<LinksPanelState>(() => readPanelFromUrl());
  const linkDraftSnapshots = useRef<Map<string, LinkDraftSnapshot>>(new Map());
  const folderDraftSnapshots = useRef<Map<string, FolderDraftSnapshot>>(
    new Map()
  );

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    type: "folder" | "link" | null;
    id: string | null;
    name: string | null;
  }>({ open: false, type: null, id: null, name: null });

  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [, startOpenDraftTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const closePanel = useCallback(() => {
    const next: LinksPanelState = { mode: "closed" };
    setPanel(next);
    writePanelToUrl(next);
  }, [writePanelToUrl]);

  const cleanupDraftIfUnchanged = useCallback(
    (state: Extract<LinksPanelState, { mode: "open" }>) => {
      if (state.kind === "link") {
        const link = library.links.find((l) => l.id === state.id);
        const snapshot = linkDraftSnapshots.current.get(state.id);
        if (link && snapshot && isLinkDraftUnchanged(link, snapshot)) {
          void library.removeLink(state.id);
        }
        linkDraftSnapshots.current.delete(state.id);
        return;
      }
      const folder = library.folders.find((f) => f.id === state.id);
      const snapshot = folderDraftSnapshots.current.get(state.id);
      if (folder && snapshot && isFolderDraftUnchanged(folder, snapshot)) {
        void library.removeFolder(state.id);
      }
      folderDraftSnapshots.current.delete(state.id);
    },
    [library]
  );

  const setPanelWithCleanup = useCallback(
    (next: LinksPanelState) => {
      if (panel.mode === "open") {
        const unchangedTarget =
          next.mode === "open" &&
          next.id === panel.id &&
          next.kind === panel.kind;
        if (!unchangedTarget) {
          cleanupDraftIfUnchanged(panel);
        }
      }
      setPanel(next);
      writePanelToUrl(next);
    },
    [cleanupDraftIfUnchanged, panel, writePanelToUrl]
  );

  const panelRef = useRef(panel);
  panelRef.current = panel;

  useEffect(() => {
    const fromUrl = readPanelFromUrl();
    if (fromUrl.mode === "open") {
      if (
        panelRef.current.mode !== "open" ||
        panelRef.current.id !== fromUrl.id ||
        panelRef.current.kind !== fromUrl.kind
      ) {
        if (panelRef.current.mode === "open") {
          cleanupDraftIfUnchanged(panelRef.current);
        }
        setPanel(fromUrl);
      }
      return;
    }
    if (panelRef.current.mode === "open") {
      cleanupDraftIfUnchanged(panelRef.current);
      setPanel({ mode: "closed" });
    }
  }, [searchParams, readPanelFromUrl, cleanupDraftIfUnchanged]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        return;
      }
      if (panel.mode === "open") {
        cleanupDraftIfUnchanged(panel);
      }
      closePanel();
    },
    [cleanupDraftIfUnchanged, closePanel, panel]
  );

  const expandFolder = useCallback((folderId: string | null) => {
    const displayId = folderId ?? ALL_FOLDER_ID;
    setExpandedFolderIds((prev) => {
      if (prev.has(displayId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(displayId);
      return next;
    });
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
    setCreateParentFolderId(isAllFolderId(folderId) ? ALL_FOLDER_ID : folderId);
  }, []);

  const openCreateLink = useCallback(() => {
    if (panel.mode === "open") {
      cleanupDraftIfUnchanged(panel);
    }
    const storageFolderId = toStorageFolderId(
      createParentFolderId ?? ALL_FOLDER_ID
    );
    startOpenDraftTransition(async () => {
      const created = await library.createLink(
        { name: LINK_DRAFT_DEFAULT_NAME, url: LINK_DRAFT_PLACEHOLDER_URL },
        storageFolderId
      );
      if (!created) {
        return;
      }
      const displayName = resolveLinkDisplayName(
        LINK_DRAFT_DEFAULT_NAME,
        LINK_DRAFT_PLACEHOLDER_URL
      );
      linkDraftSnapshots.current.set(
        created.id,
        createLinkDraftSnapshot(
          displayName,
          LINK_DRAFT_PLACEHOLDER_URL,
          storageFolderId
        )
      );
      expandFolder(storageFolderId);
      setCreateParentFolderId(storageFolderId ?? ALL_FOLDER_ID);
      setPanelWithCleanup({ mode: "open", kind: "link", id: created.id });
    });
  }, [
    cleanupDraftIfUnchanged,
    createParentFolderId,
    expandFolder,
    library,
    panel,
    setPanelWithCleanup,
  ]);

  const openCreateFolder = useCallback(() => {
    if (panel.mode === "open") {
      cleanupDraftIfUnchanged(panel);
    }
    const storageParentId = toStorageFolderId(
      createParentFolderId ?? ALL_FOLDER_ID
    );
    startOpenDraftTransition(async () => {
      const created = await library.createFolder(
        { name: FOLDER_DRAFT_DEFAULT_NAME },
        storageParentId
      );
      if (!created) {
        return;
      }
      folderDraftSnapshots.current.set(
        created.id,
        createFolderDraftSnapshot(FOLDER_DRAFT_DEFAULT_NAME, storageParentId)
      );
      expandFolder(storageParentId);
      setCreateParentFolderId(storageParentId ?? ALL_FOLDER_ID);
      setPanelWithCleanup({ mode: "open", kind: "folder", id: created.id });
    });
  }, [
    cleanupDraftIfUnchanged,
    createParentFolderId,
    expandFolder,
    library,
    panel,
    setPanelWithCleanup,
  ]);

  const openEditLink = useCallback(
    (linkId: string) => {
      setPanelWithCleanup({ mode: "open", kind: "link", id: linkId });
    },
    [setPanelWithCleanup]
  );

  const openEditFolder = useCallback(
    (folderId: string) => {
      if (isAllFolderId(folderId)) {
        return;
      }
      setPanelWithCleanup({ mode: "open", kind: "folder", id: folderId });
    },
    [setPanelWithCleanup]
  );

  const editingLink = useMemo(
    () =>
      panel.mode === "open" && panel.kind === "link"
        ? (library.links.find((l) => l.id === panel.id) ?? null)
        : null,
    [library.links, panel]
  );

  const editingFolder = useMemo(
    () =>
      panel.mode === "open" && panel.kind === "folder"
        ? (library.folders.find((f) => f.id === panel.id) ?? null)
        : null,
    [library.folders, panel]
  );

  const sheetTitle =
    panel.mode === "open"
      ? panel.kind === "link"
        ? "Link Details"
        : "Folder Details"
      : "";

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

  const handleConfirmDelete = () => {
    const targetId = deleteState.id;
    const targetType = deleteState.type;
    if (!targetId || !targetType || isAllFolderId(targetId)) {
      return;
    }
    startDeleteTransition(async () => {
      if (targetType === "folder") {
        await library.removeFolder(targetId);
        folderDraftSnapshots.current.delete(targetId);
        setExpandedFolderIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        if (createParentFolderId === targetId) {
          setCreateParentFolderId(null);
        }
        if (panel.mode === "open" && panel.id === targetId) {
          closePanel();
        }
      } else {
        await library.removeLink(targetId);
        linkDraftSnapshots.current.delete(targetId);
        if (panel.mode === "open" && panel.id === targetId) {
          closePanel();
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

      <E2eeEntityDetailSheet
        open={panel.mode === "open"}
        onOpenChange={handleSheetOpenChange}
        title={sheetTitle}
        entityId={panel.mode === "open" ? panel.id : null}
      >
        {panel.mode === "open" && panel.kind === "link" && editingLink ? (
          <LinkEditor
            key={editingLink.id}
            link={editingLink}
            folders={library.folders}
            onClose={() => handleSheetOpenChange(false)}
            onRefresh={library.refresh}
            onDelete={() =>
              setDeleteState({
                open: true,
                type: "link",
                id: editingLink.id,
                name: editingLink.name,
              })
            }
            onSave={(input) => library.updateLink(editingLink.id, input)}
          />
        ) : null}
        {panel.mode === "open" && panel.kind === "folder" && editingFolder ? (
          <FolderEditor
            key={editingFolder.id}
            folder={editingFolder}
            folders={library.folders}
            onClose={() => handleSheetOpenChange(false)}
            onRefresh={library.refresh}
            onDelete={() =>
              setDeleteState({
                open: true,
                type: "folder",
                id: editingFolder.id,
                name: editingFolder.name,
              })
            }
            onSave={(input) => library.updateFolder(editingFolder.id, input)}
          />
        ) : null}
      </E2eeEntityDetailSheet>

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

/** Flat search result row (tree hidden while search is active). */
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
