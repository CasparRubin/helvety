import type { Link, LinkFolder } from "@/lib/types";

/** Breadcrumb segment for folder navigation. */
export interface FolderBreadcrumb {
  id: string;
  name: string;
}

/** Children at a folder level (null parent = root). */
export interface FolderChildren {
  folders: LinkFolder[];
  links: Link[];
}

/**
 *
 */
function sortByOrder<T extends { sort_order: number; created_at: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

/** Returns folders and links directly under `parentFolderId` (null = root). */
export function getChildren(
  folders: LinkFolder[],
  links: Link[],
  parentFolderId: string | null
): FolderChildren {
  const childFolders = folders.filter(
    (f) => (f.parent_folder_id ?? null) === parentFolderId
  );
  const childLinks = links.filter(
    (l) => (l.folder_id ?? null) === parentFolderId
  );
  return {
    folders: sortByOrder(childFolders),
    links: sortByOrder(childLinks),
  };
}

/** Ancestor chain from root to `folderId` (inclusive). */
export function getBreadcrumbs(
  folders: LinkFolder[],
  folderId: string
): FolderBreadcrumb[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const crumbs: FolderBreadcrumb[] = [];
  let current = byId.get(folderId);
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    current = current.parent_folder_id
      ? byId.get(current.parent_folder_id)
      : undefined;
  }
  return crumbs;
}

/** Human-readable path for search results. */
export function formatFolderPath(
  folders: LinkFolder[],
  folderId: string | null
): string {
  if (!folderId) {
    return "Home";
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
  if (targetParentId === null) {
    return true;
  }
  if (targetParentId === folderId) {
    return false;
  }
  const descendants = new Set<string>();
  const collect = (parentId: string) => {
    for (const f of folders) {
      if (f.parent_folder_id === parentId) {
        descendants.add(f.id);
        collect(f.id);
      }
    }
  };
  collect(folderId);
  return !descendants.has(targetParentId);
}
