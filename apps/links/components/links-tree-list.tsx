"use client";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import { useE2eeEntityListDndSensors } from "@helvety/ui/use-e2ee-entity-list-dnd-sensors";
import {
  ChevronRight,
  EllipsisVertical,
  ExternalLink,
  Folder,
  FolderTree,
  GripVertical,
  Link2,
  Pencil,
} from "lucide-react";
import { Fragment, useCallback, useMemo, useState } from "react";

import {
  ALL_FOLDER_ID,
  isAllFolderId,
  toDisplayFolderId,
} from "@/lib/all-folder";
import {
  getChildren,
  listLinksInFolder,
  listLinksInFolderTree,
} from "@/lib/link-tree";
import {
  listVisibleTreeDragIds,
  parseFolderDropId,
  parseTreeDragId,
  resolveTreeDropAction,
  toFolderDropId,
  toTreeDragId,
} from "@/lib/link-tree-dnd";
import { openLinksInNewTabs } from "@/lib/open-links";

import type { TreeDropAction } from "@/lib/link-tree-dnd";
import type { Link, LinkFolder } from "@/lib/types";

const BASE_PADDING_REM = 0.75;
const DISCLOSURE_COLUMN_REM = 1.25;
/** Responsive indent per tree level (tighter on narrow viewports). */
const TREE_INDENT_PER_LEVEL = "clamp(0.75rem, 2.5vw, 1.25rem)";

const TREE_ROW_CLASS =
  "flex w-full items-center gap-1 overflow-hidden px-2 py-2.5 sm:gap-2 sm:px-3";

/**
 * Left padding for nested rows; optional extra aligns link rows with folder chevrons.
 */
function treeRowPaddingLeft(depth: number, extraRem = 0): string {
  return `calc(${BASE_PADDING_REM + extraRem}rem + ${depth} * ${TREE_INDENT_PER_LEVEL})`;
}

/** Props for the nested links tree list. */
interface LinksTreeListProps {
  folders: LinkFolder[];
  links: Link[];
  expandedFolderIds: ReadonlySet<string>;
  onToggleFolder: (folderId: string) => void;
  onEditLink: (linkId: string) => void;
  onEditFolder: (folderId: string) => void;
  onTreeDrop: (action: TreeDropAction) => Promise<boolean>;
  onExpandFolder: (folderId: string) => void;
  sortableDisabled?: boolean;
}

/**
 * Finder-style nested list with drag-and-drop reorder and reparenting.
 */
export function LinksTreeList({
  folders,
  links,
  expandedFolderIds,
  onToggleFolder,
  onEditLink,
  onEditFolder,
  onTreeDrop,
  onExpandFolder,
  sortableDisabled = false,
}: LinksTreeListProps): React.JSX.Element {
  const sensors = useE2eeEntityListDndSensors();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(
    null
  );

  const visibleDragIds = useMemo(
    () => listVisibleTreeDragIds(folders, links, expandedFolderIds),
    [expandedFolderIds, folders, links]
  );

  const activeItem = useMemo(() => {
    if (!activeDragId) {
      return null;
    }
    const parsed = parseTreeDragId(activeDragId);
    if (!parsed) {
      return null;
    }
    if (parsed.kind === "folder") {
      return folders.find((f) => f.id === parsed.id) ?? null;
    }
    return links.find((l) => l.id === parsed.id) ?? null;
  }, [activeDragId, folders, links]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setDropTargetFolderId(null);
        return;
      }

      const overId = String(over.id);
      const folderDrop = parseFolderDropId(overId);
      if (folderDrop) {
        setDropTargetFolderId(folderDrop.folderId);
        return;
      }

      const parsed = parseTreeDragId(overId);
      if (!parsed) {
        setDropTargetFolderId(null);
        return;
      }

      if (parsed.kind === "folder") {
        setDropTargetFolderId(parsed.id);
        return;
      }

      const link = links.find((l) => l.id === parsed.id);
      setDropTargetFolderId(toDisplayFolderId(link?.folder_id ?? null));
    },
    [links]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null);
      setDropTargetFolderId(null);

      const { active, over } = event;
      if (!over || sortableDisabled) {
        return;
      }

      const action = resolveTreeDropAction(
        folders,
        links,
        String(active.id),
        String(over.id)
      );
      if (!action) {
        return;
      }

      const ok = await onTreeDrop(action);
      if (!ok) {
        return;
      }

      if (action.type === "move-folder" || action.type === "move-link") {
        const targetFolderId =
          action.type === "move-folder"
            ? action.targetParentId
            : action.targetFolderId;
        onExpandFolder(targetFolderId ?? ALL_FOLDER_ID);
      }
    },
    [folders, links, onExpandFolder, onTreeDrop, sortableDisabled]
  );

  const underAll = getChildren(folders, links, ALL_FOLDER_ID);
  const isEmpty = underAll.folders.length === 0 && underAll.links.length === 0;

  if (isEmpty) {
    return (
      <p className="text-muted-foreground p-4 text-sm">
        No bookmarks yet. Create a folder or link to get started.
      </p>
    );
  }

  const list = (
    <RootDropZone disabled={sortableDisabled}>
      <ul className="divide-border divide-y rounded-lg border">
        <TreeLevel
          parentFolderId={null}
          depth={0}
          folders={folders}
          links={links}
          expandedFolderIds={expandedFolderIds}
          dropTargetFolderId={dropTargetFolderId}
          sortableDisabled={sortableDisabled}
          onToggleFolder={onToggleFolder}
          onEditLink={onEditLink}
          onEditFolder={onEditFolder}
        />
      </ul>
    </RootDropZone>
  );

  if (sortableDisabled) {
    return list;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <SortableContext
        items={visibleDragIds}
        strategy={verticalListSortingStrategy}
      >
        {list}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="bg-muted/90 flex items-center gap-2 rounded-md border px-3 py-2 shadow-lg">
            {"url" in activeItem ? (
              <>
                <Link2 className="text-muted-foreground size-4" />
                <span className="truncate font-medium">{activeItem.name}</span>
              </>
            ) : (
              <>
                <Folder className="text-muted-foreground size-4" />
                <span className="truncate font-medium">{activeItem.name}</span>
              </>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Recursive tree branch for one folder level. */
interface TreeLevelProps {
  parentFolderId: string | null;
  depth: number;
  folders: LinkFolder[];
  links: Link[];
  expandedFolderIds: ReadonlySet<string>;
  dropTargetFolderId: string | null;
  sortableDisabled: boolean;
  onToggleFolder: (folderId: string) => void;
  onEditLink: (linkId: string) => void;
  onEditFolder: (folderId: string) => void;
}

/** Renders folders and links at a single tree depth. */
function TreeLevel({
  parentFolderId,
  depth,
  folders,
  links,
  expandedFolderIds,
  dropTargetFolderId,
  sortableDisabled,
  onToggleFolder,
  onEditLink,
  onEditFolder,
}: TreeLevelProps): React.JSX.Element {
  const { folders: childFolders, links: childLinks } = getChildren(
    folders,
    links,
    parentFolderId
  );

  return (
    <>
      {childFolders.map((folder) => {
        const isAllFolder = isAllFolderId(folder.id);
        const expanded = expandedFolderIds.has(folder.id);
        const paddingLeft = treeRowPaddingLeft(depth);
        const dragId = toTreeDragId("folder", folder.id);
        const isDropTarget = dropTargetFolderId === folder.id;
        const directLinkCount = listLinksInFolder(links, folder.id).length;
        const treeLinkCount = listLinksInFolderTree(
          folders,
          links,
          folder.id
        ).length;

        return (
          <Fragment key={folder.id}>
            <FolderTreeRow
              folder={folder}
              dragId={dragId}
              paddingLeft={paddingLeft}
              expanded={expanded}
              isDropTarget={isDropTarget}
              sortableDisabled={sortableDisabled || isAllFolder}
              isSystemFolder={isAllFolder}
              directLinkCount={directLinkCount}
              treeLinkCount={treeLinkCount}
              onToggle={() => onToggleFolder(folder.id)}
              onEdit={isAllFolder ? undefined : () => onEditFolder(folder.id)}
              onOpenDirectLinks={() =>
                openLinksInNewTabs(listLinksInFolder(links, folder.id))
              }
              onOpenAllLinks={() =>
                openLinksInNewTabs(
                  listLinksInFolderTree(folders, links, folder.id)
                )
              }
            />
            {expanded ? (
              <TreeLevel
                parentFolderId={folder.id}
                depth={depth + 1}
                folders={folders}
                links={links}
                expandedFolderIds={expandedFolderIds}
                dropTargetFolderId={dropTargetFolderId}
                sortableDisabled={sortableDisabled}
                onToggleFolder={onToggleFolder}
                onEditLink={onEditLink}
                onEditFolder={onEditFolder}
              />
            ) : null}
          </Fragment>
        );
      })}
      {childLinks.map((link) => (
        <LinkTreeRow
          key={link.id}
          link={link}
          dragId={toTreeDragId("link", link.id)}
          paddingLeft={treeRowPaddingLeft(depth, DISCLOSURE_COLUMN_REM)}
          sortableDisabled={sortableDisabled}
          onOpen={() => window.open(link.url, "_blank", "noopener,noreferrer")}
          onEdit={() => onEditLink(link.id)}
        />
      ))}
    </>
  );
}

/** Droppable wrapper so items can be dropped into the All folder. */
function RootDropZone({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled: boolean;
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: toFolderDropId(null),
    disabled,
    data: { type: "folder-drop" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-colors",
        isOver && "ring-primary/40 ring-2"
      )}
    >
      {children}
    </div>
  );
}

/** Icon-only row action that does not trigger row click handlers. */
function RowIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground shrink-0"
      disabled={disabled}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

/**
 * Folder actions: inline icon buttons on desktop, overflow menu on mobile.
 */
function FolderRowActions({
  folderName,
  directLinkCount,
  treeLinkCount,
  onOpenDirectLinks,
  onOpenAllLinks,
  onEdit,
  showEdit = true,
}: {
  folderName: string;
  directLinkCount: number;
  treeLinkCount: number;
  onOpenDirectLinks: () => void;
  onOpenAllLinks: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
}): React.JSX.Element {
  const openDirectLabel = `Open ${directLinkCount} link${directLinkCount === 1 ? "" : "s"} in ${folderName}`;
  const openTreeLabel = `Open ${treeLinkCount} link${treeLinkCount === 1 ? "" : "s"} in ${folderName} and subfolders`;

  return (
    <>
      <div className="hidden shrink-0 items-center gap-0.5 md:flex">
        <RowIconButton
          label={openDirectLabel}
          disabled={directLinkCount === 0}
          onClick={onOpenDirectLinks}
        >
          <ExternalLink className="size-4" />
        </RowIconButton>
        <RowIconButton
          label={openTreeLabel}
          disabled={treeLinkCount === 0}
          onClick={onOpenAllLinks}
        >
          <FolderTree className="size-4" />
        </RowIconButton>
        {showEdit && onEdit ? (
          <RowIconButton label={`Edit folder ${folderName}`} onClick={onEdit}>
            <Pencil className="size-4" />
          </RowIconButton>
        ) : null}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground shrink-0 md:hidden"
            aria-label={`Actions for folder ${folderName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            disabled={directLinkCount === 0}
            onClick={onOpenDirectLinks}
          >
            <ExternalLink className="mr-2 size-4" />
            <span>Open links in folder</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={treeLinkCount === 0}
            onClick={onOpenAllLinks}
          >
            <FolderTree className="mr-2 size-4" />
            <span>Open all in tree</span>
          </DropdownMenuItem>
          {showEdit && onEdit ? (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-4" />
              <span>Edit folder</span>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

/**
 *
 */
function FolderTreeRow({
  folder,
  dragId,
  paddingLeft,
  expanded,
  isDropTarget,
  sortableDisabled,
  isSystemFolder = false,
  directLinkCount,
  treeLinkCount,
  onToggle,
  onEdit,
  onOpenDirectLinks,
  onOpenAllLinks,
}: {
  folder: LinkFolder;
  dragId: string;
  paddingLeft: string;
  expanded: boolean;
  isDropTarget: boolean;
  sortableDisabled: boolean;
  isSystemFolder?: boolean;
  directLinkCount: number;
  treeLinkCount: number;
  onToggle: () => void;
  onEdit?: () => void;
  onOpenDirectLinks: () => void;
  onOpenAllLinks: () => void;
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dragId, disabled: sortableDisabled });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: toFolderDropId(folder.id),
    disabled: sortableDisabled,
    data: { type: "folder-drop" },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft,
  };

  const highlight = isOver || isDropTarget;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        TREE_ROW_CLASS,
        "transition-colors",
        isDragging && "opacity-40",
        highlight && "bg-primary/10 ring-primary/30 ring-1 ring-inset"
      )}
    >
      {sortableDisabled ? (
        <span className="hidden w-4 shrink-0 md:block" aria-hidden />
      ) : (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hidden shrink-0 cursor-grab touch-none md:flex"
          aria-label={`Drag folder ${folder.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-expanded={expanded}
        aria-label={
          expanded
            ? `Collapse folder ${folder.name}`
            : `Expand folder ${folder.name}`
        }
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <ChevronRight
          className={cn("size-4 transition-transform", expanded && "rotate-90")}
          aria-hidden
        />
      </Button>
      <button
        type="button"
        className="hover:bg-muted/50 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left"
        onClick={onToggle}
      >
        <Folder className="text-muted-foreground size-4 shrink-0 sm:size-5" />
        <span className="truncate font-medium">{folder.name}</span>
      </button>
      <FolderRowActions
        folderName={folder.name}
        directLinkCount={directLinkCount}
        treeLinkCount={treeLinkCount}
        onOpenDirectLinks={onOpenDirectLinks}
        onOpenAllLinks={onOpenAllLinks}
        onEdit={onEdit}
        showEdit={!isSystemFolder}
      />
    </li>
  );
}

/**
 *
 */
function LinkTreeRow({
  link,
  dragId,
  paddingLeft,
  sortableDisabled,
  onOpen,
  onEdit,
}: {
  link: Link;
  dragId: string;
  paddingLeft: string;
  sortableDisabled: boolean;
  onOpen: () => void;
  onEdit: () => void;
}): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dragId, disabled: sortableDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(TREE_ROW_CLASS, isDragging && "opacity-40")}
    >
      {sortableDisabled ? (
        <span className="hidden w-4 shrink-0 md:block" aria-hidden />
      ) : (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hidden shrink-0 cursor-grab touch-none md:flex"
          aria-label={`Drag link ${link.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <span className="w-7 shrink-0 sm:w-8 md:hidden" aria-hidden />
      <button
        type="button"
        className="hover:bg-muted/50 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left"
        onClick={onOpen}
      >
        <Link2 className="text-muted-foreground size-4 shrink-0 sm:size-5" />
        <span className="truncate font-medium">{link.name}</span>
      </button>
      <RowIconButton label={`Edit link ${link.name}`} onClick={onEdit}>
        <Pencil className="size-4" />
      </RowIconButton>
    </li>
  );
}
