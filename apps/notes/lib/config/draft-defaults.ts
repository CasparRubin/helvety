import { isDraftSnapshotUnchanged } from "@helvety/shared/e2ee-draft";

import { DEFAULT_NOTE_CATEGORY_ID } from "@/lib/config/default-note-categories";

import type { Item } from "@/lib/types";

/** Snapshot fields compared when closing an unchanged note draft. */
export interface NoteDraftSnapshot {
  title: string;
  description: string | null;
  category_id: string;
}

/** Input for creating a new note draft row. */
export function createNoteDraftInput(categoryId = DEFAULT_NOTE_CATEGORY_ID): {
  title: string;
  description: null;
  category_id: string;
} {
  return {
    title: "",
    description: null,
    category_id: categoryId,
  };
}

/** Builds the snapshot stored when a new note draft is opened. */
export function createNoteDraftSnapshot(
  categoryId = DEFAULT_NOTE_CATEGORY_ID
): NoteDraftSnapshot {
  return {
    title: "",
    description: null,
    category_id: categoryId,
  };
}

/** Returns true when the note still matches its open-draft snapshot. */
export function isNoteDraftUnchanged(
  item: Pick<Item, "title" | "description" | "category_id">,
  snapshot: NoteDraftSnapshot
): boolean {
  return isDraftSnapshotUnchanged(
    {
      title: item.title.trim(),
      description: item.description,
      category_id: item.category_id,
    },
    snapshot
  );
}
