import { isDraftSnapshotUnchanged } from "@helvety/shared/e2ee-draft";

import type { Item } from "@/lib/types";

/** Snapshot fields compared when closing an unchanged task draft. */
export interface TaskDraftSnapshot {
  title: string;
  description: string | null;
  stage_id: string | null;
}

/** Input for creating a new task draft row. */
export function createTaskDraftInput(stageId: string | null): {
  title: string;
  description: null;
  stage_id: string | null;
} {
  return {
    title: "",
    description: null,
    stage_id: stageId,
  };
}

/** Builds the snapshot stored when a new task draft is opened. */
export function createTaskDraftSnapshot(
  stageId: string | null
): TaskDraftSnapshot {
  return {
    title: "",
    description: null,
    stage_id: stageId,
  };
}

/** Returns true when the task still matches its open-draft snapshot. */
export function isTaskDraftUnchanged(
  item: Pick<Item, "title" | "description" | "stage_id">,
  snapshot: TaskDraftSnapshot
): boolean {
  return isDraftSnapshotUnchanged(
    {
      title: item.title.trim(),
      description: item.description,
      stage_id: item.stage_id,
    },
    snapshot
  );
}
