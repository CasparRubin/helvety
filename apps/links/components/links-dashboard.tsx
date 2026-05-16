"use client";

import {
  filterE2eeDashboardItems,
  resolveE2eeEmptySearchMessage,
} from "@helvety/shared/e2ee-dashboard-search";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { CommandBarPageLayout } from "@helvety/ui/command-bar-page-layout";
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
  ListEmptyState,
  ListErrorState,
  ListLoadingState,
} from "@helvety/ui/list-states";
import {
  ChevronRight,
  ExternalLink,
  Folder,
  Link2,
  Loader2Icon,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LinkEditorSheet } from "@/components/link-editor-sheet";
import { LinksBreadcrumbs } from "@/components/links-breadcrumbs";
import { LinksCommandBar } from "@/components/links-command-bar";
import { useDataExport } from "@/hooks/use-data-export";
import { useLinkLibrary } from "@/hooks/use-link-library";
import { useEncryptionContext } from "@/lib/crypto";
import { formatFolderPath, getBreadcrumbs, getChildren } from "@/lib/link-tree";

import type { Link, LinkFolderRow, LinkRow } from "@/lib/types";

/**
 *
 */
interface LinksDashboardProps {
  initialEncryptedFolders?: LinkFolderRow[];
  initialEncryptedLinks?: LinkRow[];
}

/**
 *
 */
export function LinksDashboard({
  initialEncryptedFolders,
  initialEncryptedLinks,
}: LinksDashboardProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");
  const currentFolderId =
    folderParam && folderParam.length > 0 ? folderParam : null;

  const { isUnlocked, masterKey } = useEncryptionContext();
  const library = useLinkLibrary({
    initialEncryptedFolders,
    initialEncryptedLinks,
  });
  const { isExporting, handleExportData } = useDataExport(masterKey);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
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

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (folderId) {
        params.set("folder", folderId);
      } else {
        params.delete("folder");
      }
      const query = params.toString();
      router.push(query ? `/links?${query}` : "/links");
    },
    [router, searchParams]
  );

  const breadcrumbs = useMemo(() => {
    if (!currentFolderId) {
      return [];
    }
    return getBreadcrumbs(library.folders, currentFolderId);
  }, [currentFolderId, library.folders]);

  const { folders: childFolders, links: childLinks } = useMemo(
    () => getChildren(library.folders, library.links, currentFolderId),
    [currentFolderId, library.folders, library.links]
  );

  const selectedLink = useMemo(
    () => library.links.find((l) => l.id === selectedLinkId) ?? null,
    [library.links, selectedLinkId]
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

  const handleCreateFolder = () => {
    startCreateTransition(async () => {
      const name = newFolderName.trim();
      if (!name) {
        return;
      }
      const created = await library.createFolder({ name }, currentFolderId);
      if (created) {
        setNewFolderName("");
        setIsCreateFolderOpen(false);
      }
    });
  };

  const handleCreateLink = () => {
    startCreateTransition(async () => {
      const name = newLinkName.trim();
      const url = newLinkUrl.trim();
      if (!name || !url) {
        return;
      }
      const created = await library.createLink({ name, url }, currentFolderId);
      if (created) {
        setNewLinkName("");
        setNewLinkUrl("");
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
        if (currentFolderId === targetId) {
          navigateToFolder(null);
        }
      } else {
        await library.removeLink(targetId);
        if (selectedLinkId === targetId) {
          setSelectedLinkId(null);
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
            onCreateClick={() => setIsCreateLinkOpen(true)}
            createLabel="New link"
            onRefresh={handleRefresh}
            isRefreshing={library.isRefreshing || isRefreshPending}
            onEdit={
              selectedLink
                ? () => setSelectedLinkId(selectedLink.id)
                : undefined
            }
            editLabel="Edit link"
            onDelete={
              selectedLink
                ? () =>
                    setDeleteState({
                      open: true,
                      type: "link",
                      id: selectedLink.id,
                      name: selectedLink.name,
                    })
                : undefined
            }
            deleteLabel="Delete link"
            onExport={handleExportData}
            isExporting={isExporting}
          />
        }
      >
        <div className="container mx-auto px-4 pb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <LinksBreadcrumbs
              crumbs={breadcrumbs}
              onNavigate={navigateToFolder}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateFolderOpen(true)}
              >
                New folder
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreateLinkOpen(true)}
              >
                New link
              </Button>
            </div>
          </div>

          {library.isLoading ? (
            <ListLoadingState />
          ) : library.error ? (
            <ListErrorState message={library.error} onRetry={library.refresh} />
          ) : !isUnlocked ? (
            <ListEmptyState
              title="Locked"
              description="Unlock encryption with your passkey to view bookmarks."
            />
          ) : (
            <>
              <ListSearchField
                className="mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search links…"
                aria-label="Search links"
              />

              {searchActive ? (
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
                            window.open(
                              link.url,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                          onSelect={() => setSelectedLinkId(link.id)}
                        />
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <ul className="divide-border divide-y rounded-lg border">
                  {childFolders.length === 0 && childLinks.length === 0 ? (
                    <li className="text-muted-foreground p-4 text-sm">
                      This folder is empty. Create a folder or link to get
                      started.
                    </li>
                  ) : (
                    <>
                      {childFolders.map((folder) => (
                        <li key={folder.id}>
                          <div className="flex w-full items-center gap-2 p-3">
                            <button
                              type="button"
                              className="hover:bg-muted/50 flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
                              onClick={() => navigateToFolder(folder.id)}
                            >
                              <Folder className="text-muted-foreground size-5 shrink-0" />
                              <span className="truncate font-medium">
                                {folder.name}
                              </span>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete folder ${folder.name}`}
                              onClick={() =>
                                setDeleteState({
                                  open: true,
                                  type: "folder",
                                  id: folder.id,
                                  name: folder.name,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Open folder ${folder.name}`}
                              onClick={() => navigateToFolder(folder.id)}
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                      {childLinks.map((link) => (
                        <li key={link.id}>
                          <div
                            className={cn(
                              "flex w-full items-center gap-2 p-3",
                              selectedLinkId === link.id && "bg-muted/50"
                            )}
                          >
                            <button
                              type="button"
                              className="hover:bg-muted/50 flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
                              onClick={() => setSelectedLinkId(link.id)}
                            >
                              <Link2 className="text-muted-foreground size-5 shrink-0" />
                              <span className="truncate font-medium">
                                {link.name}
                              </span>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Open ${link.name}`}
                              onClick={() =>
                                window.open(
                                  link.url,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <ExternalLink className="size-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      </CommandBarPageLayout>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Folders can contain links and other folders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-folder-name">Name</Label>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={isCreatePending || !newFolderName.trim()}
              onClick={handleCreateFolder}
            >
              {isCreatePending ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateLinkOpen} onOpenChange={setIsCreateLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New link</DialogTitle>
            <DialogDescription>
              Saved encrypted in the current folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-link-name">Name</Label>
              <Input
                id="new-link-name"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-link-url">URL</Label>
              <Input
                id="new-link-url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                autoComplete="off"
                inputMode="url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={
                isCreatePending || !newLinkName.trim() || !newLinkUrl.trim()
              }
              onClick={handleCreateLink}
            >
              {isCreatePending ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LinkEditorSheet
        open={selectedLinkId !== null}
        link={selectedLink}
        folders={library.folders}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLinkId(null);
          }
        }}
        isSaving={isSavePending}
        onSave={(input) => {
          if (!selectedLink) {
            return Promise.resolve(false);
          }
          return new Promise((resolve) => {
            startSaveTransition(async () => {
              const ok = await library.updateLink(selectedLink.id, input);
              if (ok) {
                setSelectedLinkId(null);
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
  onSelect,
}: {
  link: Link;
  sublabel?: string;
  onOpen: () => void;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 p-3">
      <button
        type="button"
        className="hover:bg-muted/50 flex min-w-0 flex-1 flex-col rounded-md px-2 py-1 text-left"
        onClick={onSelect}
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
        size="icon"
        aria-label={`Open ${link.name}`}
        onClick={onOpen}
      >
        <ExternalLink className="size-4" />
      </Button>
    </div>
  );
}
