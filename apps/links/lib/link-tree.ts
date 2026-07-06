import { sortE2eeByOrder } from "@helvety/shared/link-tree-ops";

import {
  ALL_FOLDER_ID,
  ALL_FOLDER_NAME,
  createAllFolder,
  isAllFolderId,
  resolveAllFolderUserId,
} from "@/lib/all-folder";

import type { Link, LinkFolder } from "@/lib/types";

/** Folder name segment for path display (e.g. search results). */
export interface FolderBreadcrumb {
  id: string;
  name: string;
}

/** Children at a folder level (`null` = only All; `ALL_FOLDER_ID` = inside All). */
export interface FolderChildren {
  folders: LinkFolder[];
  links: Link[];
}

/** All descendant folder ids under `folderId` (not including `folderId`). */
export function getDescendantFolderIds(
  folders: LinkFolder[],
  folderId: string
): string[] {
  if (isAllFolderId(folderId)) {
    const topLevel = folders
      .filter((f) => (f.parent_folder_id ?? null) === null)
      .map((f) => f.id);
    const ids: string[] = [...topLevel];
    for (const id of topLevel) {
      ids.push(...getDescendantFolderIds(folders, id));
    }
    return ids;
  }

  const ids: string[] = [];
  const collect = (parentId: string) => {
    for (const f of folders) {
      if (f.parent_folder_id === parentId) {
        ids.push(f.id);
        collect(f.id);
      }
    }
  };
  collect(folderId);
  return ids;
}

/** Links stored directly in `folderId` (sorted). */
export function listLinksInFolder(links: Link[], folderId: string): Link[] {
  if (isAllFolderId(folderId)) {
    return sortE2eeByOrder(links.filter((l) => (l.folder_id ?? null) === null));
  }
  return sortE2eeByOrder(
    links.filter((l) => (l.folder_id ?? null) === folderId)
  );
}

/** Links in `folderId` and every nested subfolder (sorted). */
export function listLinksInFolderTree(
  folders: LinkFolder[],
  links: Link[],
  folderId: string
): Link[] {
  if (isAllFolderId(folderId)) {
    return sortE2eeByOrder(links);
  }

  const folderIds = new Set([
    folderId,
    ...getDescendantFolderIds(folders, folderId),
  ]);
  return sortE2eeByOrder(
    links.filter((l) => l.folder_id != null && folderIds.has(l.folder_id))
  );
}

/**
 * Returns folders and links for a tree parent.
 * `null` = only the virtual All folder; `ALL_FOLDER_ID` = library top level.
 */
export function getChildren(
  folders: LinkFolder[],
  links: Link[],
  parentFolderId: string | null
): FolderChildren {
  if (parentFolderId === null) {
    return {
      folders: [createAllFolder(resolveAllFolderUserId(folders, links))],
      links: [],
    };
  }

  const storageParentId = isAllFolderId(parentFolderId) ? null : parentFolderId;

  const childFolders = folders.filter(
    (f) => (f.parent_folder_id ?? null) === storageParentId
  );
  const childLinks = links.filter(
    (l) => (l.folder_id ?? null) === storageParentId
  );
  return {
    folders: sortE2eeByOrder(childFolders),
    links: sortE2eeByOrder(childLinks),
  };
}

/** Ancestor chain from All to `folderId` (inclusive). */
export function getBreadcrumbs(
  folders: LinkFolder[],
  folderId: string
): FolderBreadcrumb[] {
  if (isAllFolderId(folderId)) {
    return [{ id: ALL_FOLDER_ID, name: ALL_FOLDER_NAME }];
  }

  const byId = new Map(folders.map((f) => [f.id, f]));
  const crumbs: FolderBreadcrumb[] = [];
  let current = byId.get(folderId);
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    current = current.parent_folder_id
      ? byId.get(current.parent_folder_id)
      : undefined;
  }
  crumbs.unshift({ id: ALL_FOLDER_ID, name: ALL_FOLDER_NAME });
  return crumbs;
}

/** Human-readable path for search results. */
export function formatFolderPath(
  folders: LinkFolder[],
  folderId: string | null
): string {
  if (folderId === null || isAllFolderId(folderId)) {
    return ALL_FOLDER_NAME;
  }
  return getBreadcrumbs(folders, folderId)
    .map((c) => c.name)
    .join(" / ");
}

/**
 * Returns false if `targetParentId` is `folderId` or a descendant of `folderId`.
 * Used before moving a folder client-side.
 */
export function canMoveFolderToParent(
  folders: LinkFolder[],
  folderId: string,
  targetParentId: string | null
): boolean {
  if (isAllFolderId(folderId)) {
    return false;
  }

  const storageTarget = isAllFolderId(targetParentId) ? null : targetParentId;

  if (storageTarget === null) {
    return true;
  }
  if (storageTarget === folderId) {
    return false;
  }
  const descendants = new Set(getDescendantFolderIds(folders, folderId));
  return !descendants.has(storageTarget);
}
