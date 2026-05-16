import { computeReorderUpdates } from "@helvety/shared/entity-list-reorder";

import { canMoveFolderToParent, getChildren } from "@/lib/link-tree";

import type { Link, LinkFolder } from "@/lib/types";

/** Sortable row kind in the links tree. */
export type TreeItemKind = "folder" | "link";

/** Prefix drag ids so folder and link UUIDs never collide in dnd-kit. */
export function toTreeDragId(kind: TreeItemKind, id: string): string {
  return `${kind}:${id}`;
}

/** Droppable target id for moving items into a folder (or root). */
export function toFolderDropId(folderId: string | null): string {
  return folderId ? `drop:folder:${folderId}` : "drop:folder:root";
}

/** Parses a sortable drag id into folder or link kind + entity id. */
export function parseTreeDragId(
  dragId: string
): { kind: TreeItemKind; id: string } | null {
  const match = /^(folder|link):(.+)$/.exec(dragId);
  if (!match) {
    return null;
  }
  return { kind: match[1] as TreeItemKind, id: match[2]! };
}

/**
 *
 */
export function parseFolderDropId(
  dropId: string
): { kind: "folder-drop"; folderId: string | null } | null {
  if (dropId === "drop:folder:root") {
    return { kind: "folder-drop", folderId: null };
  }
  const match = /^drop:folder:(.+)$/.exec(dropId);
  if (!match) {
    return null;
  }
  return { kind: "folder-drop", folderId: match[1]! };
}

/** Resolved drag-end operation for the links tree. */
export type TreeDropAction =
  | {
      type: "reorder-folders";
      parentFolderId: string | null;
      updates: { id: string; sort_order: number }[];
    }
  | {
      type: "reorder-links";
      folderId: string | null;
      updates: { id: string; sort_order: number }[];
    }
  | {
      type: "move-folder";
      folderId: string;
      targetParentId: string | null;
      updates: { id: string; sort_order: number }[];
    }
  | {
      type: "move-link";
      linkId: string;
      targetFolderId: string | null;
      updates: { id: string; sort_order: number }[];
    };

/**
 * Resolves a drag end into folder/link reorder or reparent operations.
 */
export function resolveTreeDropAction(
  folders: LinkFolder[],
  links: Link[],
  activeDragId: string,
  overDragId: string
): TreeDropAction | null {
  const active = parseTreeDragId(activeDragId);
  if (!active) {
    return null;
  }

  const folderDrop = parseFolderDropId(overDragId);
  if (folderDrop) {
    return resolveIntoFolderDrop(folders, links, active, folderDrop.folderId);
  }

  const over = parseTreeDragId(overDragId);
  if (!over) {
    return null;
  }

  if (active.kind === "folder" && over.kind === "folder") {
    return resolveFolderOverFolder(folders, active.id, over.id);
  }

  if (active.kind === "link" && over.kind === "link") {
    return resolveLinkOverLink(links, active.id, over.id);
  }

  if (active.kind === "link" && over.kind === "folder") {
    return resolveIntoFolderDrop(folders, links, active, over.id);
  }

  if (active.kind === "folder" && over.kind === "link") {
    const overLink = links.find((l) => l.id === over.id);
    if (!overLink) {
      return null;
    }
    return resolveIntoFolderDrop(
      folders,
      links,
      active,
      overLink.folder_id ?? null
    );
  }

  return null;
}

/**
 *
 */
function resolveIntoFolderDrop(
  folders: LinkFolder[],
  links: Link[],
  active: { kind: TreeItemKind; id: string },
  targetFolderId: string | null
): TreeDropAction | null {
  if (active.kind === "folder") {
    if (active.id === targetFolderId) {
      return null;
    }
    if (!canMoveFolderToParent(folders, active.id, targetFolderId)) {
      return null;
    }
    return buildFolderMove(folders, active.id, targetFolderId, null);
  }

  const link = links.find((l) => l.id === active.id);
  if (!link) {
    return null;
  }
  return buildLinkMove(links, active.id, targetFolderId, null);
}

/**
 *
 */
function resolveFolderOverFolder(
  folders: LinkFolder[],
  activeId: string,
  overId: string
): TreeDropAction | null {
  if (activeId === overId) {
    return null;
  }

  const activeFolder = folders.find((f) => f.id === activeId);
  const overFolder = folders.find((f) => f.id === overId);
  if (!activeFolder || !overFolder) {
    return null;
  }

  const activeParent = activeFolder.parent_folder_id ?? null;
  const overParent = overFolder.parent_folder_id ?? null;

  if (activeParent === overParent) {
    const siblings = folders
      .filter((f) => (f.parent_folder_id ?? null) === activeParent)
      .sort((a, b) => a.sort_order - b.sort_order);
    const updates = computeReorderUpdates({
      entities: siblings,
      activeId,
      overId,
      activeEntity: activeFolder,
      groupKey: "parent_folder_id",
      droppedOnGroupContainer: false,
    });
    if (updates.length === 0) {
      return null;
    }
    return {
      type: "reorder-folders",
      parentFolderId: activeParent,
      updates: updates.map((u) => ({ id: u.id, sort_order: u.sort_order })),
    };
  }

  if (!canMoveFolderToParent(folders, activeId, overId)) {
    return null;
  }
  return buildFolderMove(folders, activeId, overId, null);
}

/**
 *
 */
function resolveLinkOverLink(
  links: Link[],
  activeId: string,
  overId: string
): TreeDropAction | null {
  if (activeId === overId) {
    return null;
  }

  const activeLink = links.find((l) => l.id === activeId);
  const overLink = links.find((l) => l.id === overId);
  if (!activeLink || !overLink) {
    return null;
  }

  const activeFolder = activeLink.folder_id ?? null;
  const overFolder = overLink.folder_id ?? null;

  if (activeFolder === overFolder) {
    const siblings = links
      .filter((l) => (l.folder_id ?? null) === activeFolder)
      .sort((a, b) => a.sort_order - b.sort_order);
    const updates = computeReorderUpdates({
      entities: siblings,
      activeId,
      overId,
      activeEntity: activeLink,
      groupKey: "folder_id",
      droppedOnGroupContainer: false,
    });
    if (updates.length === 0) {
      return null;
    }
    return {
      type: "reorder-links",
      folderId: activeFolder,
      updates: updates.map((u) => ({ id: u.id, sort_order: u.sort_order })),
    };
  }

  return buildLinkMove(links, activeId, overFolder, overId);
}

/**
 *
 */
function buildFolderMove(
  folders: LinkFolder[],
  folderId: string,
  targetParentId: string | null,
  insertBeforeId: string | null
): TreeDropAction | null {
  const moving = folders.find((f) => f.id === folderId);
  if (!moving) {
    return null;
  }

  const siblings = folders
    .filter(
      (f) =>
        (f.parent_folder_id ?? null) === targetParentId && f.id !== folderId
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const nextSiblings = insertSibling(
    siblings,
    { ...moving, parent_folder_id: targetParentId },
    insertBeforeId
  );

  return {
    type: "move-folder",
    folderId,
    targetParentId,
    updates: nextSiblings.map((f, index) => ({
      id: f.id,
      sort_order: index,
    })),
  };
}

/**
 *
 */
function buildLinkMove(
  links: Link[],
  linkId: string,
  targetFolderId: string | null,
  insertBeforeId: string | null
): TreeDropAction | null {
  const moving = links.find((l) => l.id === linkId);
  if (!moving) {
    return null;
  }

  const siblings = links
    .filter((l) => (l.folder_id ?? null) === targetFolderId && l.id !== linkId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const nextSiblings = insertSibling(
    siblings,
    { ...moving, folder_id: targetFolderId },
    insertBeforeId
  );

  return {
    type: "move-link",
    linkId,
    targetFolderId,
    updates: nextSiblings.map((l, index) => ({
      id: l.id,
      sort_order: index,
    })),
  };
}

/**
 *
 */
function insertSibling<T extends { id: string }>(
  siblings: T[],
  item: T,
  insertBeforeId: string | null
): T[] {
  const next = [...siblings];
  let insertAt = next.length;
  if (insertBeforeId) {
    const index = next.findIndex((s) => s.id === insertBeforeId);
    if (index >= 0) {
      insertAt = index;
    }
  }
  next.splice(insertAt, 0, item);
  return next;
}

/** Visible drag ids in depth-first order (expanded folders only). */
export function listVisibleTreeDragIds(
  folders: LinkFolder[],
  links: Link[],
  expandedFolderIds: ReadonlySet<string>
): string[] {
  const ids: string[] = [];

  const walk = (parentFolderId: string | null) => {
    const { folders: childFolders, links: childLinks } = getChildren(
      folders,
      links,
      parentFolderId
    );
    for (const folder of childFolders) {
      ids.push(toTreeDragId("folder", folder.id));
      if (expandedFolderIds.has(folder.id)) {
        walk(folder.id);
      }
    }
    for (const link of childLinks) {
      ids.push(toTreeDragId("link", link.id));
    }
  };

  walk(null);
  return ids;
}
