import { isDraftSnapshotUnchanged } from "@helvety/shared/e2ee-draft";

import type { Link, LinkFolder } from "@/lib/types";

/** Placeholder URL for persist-on-open link drafts (`createLink` requires a valid URL). */
export const LINK_DRAFT_PLACEHOLDER_URL = "https://example.com";

export const LINK_DRAFT_DEFAULT_NAME = "";

export const FOLDER_DRAFT_DEFAULT_NAME = "New folder";

/** Snapshot fields compared when closing an unchanged link draft. */
export interface LinkDraftSnapshot {
  name: string;
  url: string;
  folder_id: string | null;
}

/** Snapshot fields compared when closing an unchanged folder draft. */
export interface FolderDraftSnapshot {
  name: string;
  parent_folder_id: string | null;
}

/** Builds the snapshot stored when a new link draft is opened. */
export function createLinkDraftSnapshot(
  name: string,
  url: string,
  folderId: string | null
): LinkDraftSnapshot {
  return { name, url, folder_id: folderId };
}

/** Builds the snapshot stored when a new folder draft is opened. */
export function createFolderDraftSnapshot(
  name: string,
  parentFolderId: string | null
): FolderDraftSnapshot {
  return { name, parent_folder_id: parentFolderId };
}

/** Returns true when the link still matches its open-draft snapshot. */
export function isLinkDraftUnchanged(
  link: Link,
  snapshot: LinkDraftSnapshot
): boolean {
  return isDraftSnapshotUnchanged(
    {
      name: link.name,
      url: link.url,
      folder_id: link.folder_id,
    },
    snapshot
  );
}

/** Returns true when the folder still matches its open-draft snapshot. */
export function isFolderDraftUnchanged(
  folder: LinkFolder,
  snapshot: FolderDraftSnapshot
): boolean {
  return isDraftSnapshotUnchanged(
    {
      name: folder.name,
      parent_folder_id: folder.parent_folder_id,
    },
    snapshot
  );
}
