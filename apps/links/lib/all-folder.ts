import type { LinkFolder } from "@/lib/types";

/** Stable id for the virtual top-level “All” folder (never persisted). */
export const ALL_FOLDER_ID = "00000000-0000-4000-8000-000000000001";

/** Display name for the virtual top-level All folder. */
export const ALL_FOLDER_NAME = "All";

/** Returns true when `id` is the virtual All folder. */
export function isAllFolderId(id: string | null | undefined): boolean {
  return id === ALL_FOLDER_ID;
}

/** Maps UI folder ids to database `folder_id` / `parent_folder_id` (null = inside All). */
export function toStorageFolderId(
  folderId: string | null | undefined
): string | null {
  if (!folderId || isAllFolderId(folderId)) {
    return null;
  }
  return folderId;
}

/** Maps database null folder parent to the All folder id for UI. */
export function toDisplayFolderId(
  folderId: string | null | undefined
): string | null {
  if (folderId === null || folderId === undefined) {
    return ALL_FOLDER_ID;
  }
  return folderId;
}

/** Synthetic All folder shown as the only top-level tree row.
 * `created_at` / `updated_at` are empty placeholders (never persisted or
 * formatted with `formatDateTime` in the Links UI); prefer ISO strings for
 * any create-mode entity that does render Created/Modified via `formatDateTime`.
 */
export function createAllFolder(userId: string): LinkFolder {
  return {
    id: ALL_FOLDER_ID,
    user_id: userId,
    parent_folder_id: null,
    name: ALL_FOLDER_NAME,
    sort_order: Number.MIN_SAFE_INTEGER,
    created_at: "",
    updated_at: "",
  };
}

/** Resolves user id for the synthetic folder from library data. */
export function resolveAllFolderUserId(
  folders: readonly { user_id: string }[],
  links: readonly { user_id: string }[]
): string {
  return folders[0]?.user_id ?? links[0]?.user_id ?? "";
}
