/**
 * Shared link-tree helpers (extension and links app).
 */

/** Minimal folder row shape for tree child queries. */
export interface E2eeLinkTreeFolderRow {
  parent_folder_id: string | null;
  sort_order: number;
  created_at: string;
}

/** Minimal link row shape for tree child queries. */
export interface E2eeLinkTreeLinkRow {
  folder_id: string | null;
  sort_order: number;
  created_at: string;
}

/** Sorts tree items by `sort_order`, then `created_at` descending. */
export function sortE2eeByOrder<
  T extends { sort_order: number; created_at: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

/** Folders and links whose parent matches `parentFolderId` (sorted). */
export function getLinkTreeChildren<
  F extends E2eeLinkTreeFolderRow,
  L extends E2eeLinkTreeLinkRow,
>(
  folders: F[],
  links: L[],
  parentFolderId: string | null
): { folders: F[]; links: L[] } {
  const childFolders = folders.filter(
    (f) => (f.parent_folder_id ?? null) === parentFolderId
  );
  const childLinks = links.filter(
    (l) => (l.folder_id ?? null) === parentFolderId
  );
  return {
    folders: sortE2eeByOrder(childFolders),
    links: sortE2eeByOrder(childLinks),
  };
}
