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
  ListEmptySearchState,
  ListErrorState,
  ListLoadingState,
} from "@helvety/ui/list-states";
import { Pencil } from "lucide-react";
import dynamic from "next/dynamic";
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
import { useEncryptionContext } from "@/lib/crypto";
import { formatFolderPath } from "@/lib/link-tree";

import type { Link, LinkFolderRow, LinkRow } from "@/lib/types";

const LinkEditor = dynamic(
  () => import("@/components/link-editor").then((m) => m.LinkEditor),
  { ssr: false }
);

const FolderEditor = dynamic(
  () => import("@/components/folder-editor").then((m) => m.FolderEditor),
  { ssr: false }
);

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
  const { masterKey } = useEncryptionContext();
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

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    type: "folder" | "link" | null;
    id: string | null;
    name: string | null;
  }>({ open: false, type: null, id: null, name: null });

  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const closePanel = useCallback(() => {
    const next: LinksPanelState = { mode: "closed" };
    setPanel(next);
    writePanelToUrl(next);
  }, [writePanelToUrl]);

  const openEditPanel = useCallback(
    (next: Extract<LinksPanelState, { mode: "edit" }>) => {
      setPanel(next);
      writePanelToUrl(next);
    },
    [writePanelToUrl]
  );

  const panelRef = useRef(panel);
  panelRef.current = panel;

  useEffect(() => {
    const fromUrl = readPanelFromUrl();
    if (fromUrl.mode === "edit") {
      if (
        panelRef.current.mode !== "edit" ||
        panelRef.current.id !== fromUrl.id ||
        panelRef.current.kind !== fromUrl.kind
      ) {
        setPanel(fromUrl);
      }
      return;
    }
    if (panelRef.current.mode === "create") {
      return;
    }
    if (panelRef.current.mode === "edit") {
      setPanel({ mode: "closed" });
    }
  }, [searchParams, readPanelFromUrl]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        return;
      }
      closePanel();
    },
    [closePanel]
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
    const storageFolderId = toStorageFolderId(
      createParentFolderId ?? ALL_FOLDER_ID
    );
    expandFolder(storageFolderId);
    setCreateParentFolderId(storageFolderId ?? ALL_FOLDER_ID);
    setPanel({ mode: "create", kind: "link" });
  }, [createParentFolderId, expandFolder]);

  const openCreateFolder = useCallback(() => {
    const storageParentId = toStorageFolderId(
      createParentFolderId ?? ALL_FOLDER_ID
    );
    expandFolder(storageParentId);
    setCreateParentFolderId(storageParentId ?? ALL_FOLDER_ID);
    setPanel({ mode: "create", kind: "folder" });
  }, [createParentFolderId, expandFolder]);

  const openEditLink = useCallback(
    (linkId: string) => {
      openEditPanel({ mode: "edit", kind: "link", id: linkId });
    },
    [openEditPanel]
  );

  const openEditFolder = useCallback(
    (folderId: string) => {
      if (isAllFolderId(folderId)) {
        return;
      }
      openEditPanel({ mode: "edit", kind: "folder", id: folderId });
    },
    [openEditPanel]
  );

  const handleLinkCreated = useCallback(
    (id: string) => {
      openEditPanel({ mode: "edit", kind: "link", id });
    },
    [openEditPanel]
  );

  const handleFolderCreated = useCallback(
    (id: string) => {
      openEditPanel({ mode: "edit", kind: "folder", id });
    },
    [openEditPanel]
  );

  const createDefaultFolderId = useMemo(
    () => toStorageFolderId(createParentFolderId ?? ALL_FOLDER_ID),
    [createParentFolderId]
  );

  const editingLink = useMemo(
    () =>
      panel.mode === "edit" && panel.kind === "link"
        ? (library.links.find((l) => l.id === panel.id) ?? null)
        : null,
    [library.links, panel]
  );

  const editingFolder = useMemo(
    () =>
      panel.mode === "edit" && panel.kind === "folder"
        ? (library.folders.find((f) => f.id === panel.id) ?? null)
        : null,
    [library.folders, panel]
  );

  const isPanelOpen = panel.mode === "create" || panel.mode === "edit";

  const sheetTitle =
    panel.mode === "create"
      ? panel.kind === "link"
        ? "New Link"
        : "New Folder"
      : panel.mode === "edit"
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
        setExpandedFolderIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        if (createParentFolderId === targetId) {
          setCreateParentFolderId(null);
        }
        if (panel.mode === "edit" && panel.id === targetId) {
          closePanel();
        }
      } else {
        await library.removeLink(targetId);
        if (panel.mode === "edit" && panel.id === targetId) {
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
            <ListSearchField
              className="mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links…"
              aria-label="Search links"
            />
          }
          list={
            library.isLoading ? (
              <ListLoadingState />
            ) : library.error ? (
              <ListErrorState
                message={library.error}
                onRetry={library.refresh}
              />
            ) : searchActive ? (
              emptySearchMessage || filteredLinks.length === 0 ? (
                <ListEmptySearchState
                  message={emptySearchMessage ?? "No links match your search"}
                />
              ) : (
                <ul className="divide-border divide-y rounded-lg border">
                  {filteredLinks.map((link) => (
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
                  ))}
                </ul>
              )
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
        open={isPanelOpen}
        onOpenChange={handleSheetOpenChange}
        title={sheetTitle}
      >
        {panel.mode === "create" && panel.kind === "link" ? (
          <LinkEditor
            key="create-link"
            formMode="create"
            folders={library.folders}
            defaultFolderId={createDefaultFolderId}
            onCreate={(input) =>
              library.createLink(
                { name: input.name, url: input.url },
                input.folder_id
              )
            }
            onCreated={handleLinkCreated}
            onClose={() => handleSheetOpenChange(false)}
          />
        ) : null}
        {panel.mode === "edit" && panel.kind === "link" && editingLink ? (
          <LinkEditor
            key={editingLink.id}
            formMode="edit"
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
        {panel.mode === "create" && panel.kind === "folder" ? (
          <FolderEditor
            key="create-folder"
            formMode="create"
            folders={library.folders}
            defaultParentFolderId={createDefaultFolderId}
            onCreate={(input) =>
              library.createFolder({ name: input.name }, input.parent_folder_id)
            }
            onCreated={handleFolderCreated}
            onClose={() => handleSheetOpenChange(false)}
          />
        ) : null}
        {panel.mode === "edit" && panel.kind === "folder" && editingFolder ? (
          <FolderEditor
            key={editingFolder.id}
            formMode="edit"
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
