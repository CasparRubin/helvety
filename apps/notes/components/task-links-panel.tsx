"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { E2EE_APP_LINK_UI } from "@helvety/ui/e2ee-app-link-ui";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";

import { useTaskLinks } from "@/hooks/use-task-links";

import type { LinkedItem, PickerItem } from "@/lib/types";

const { sectionTitle, sectionIcon, pickerItemIcon } = E2EE_APP_LINK_UI.tasks;

const TASK_LINK_LABELS = {
  sectionTitle,
  searchPlaceholder: "Search tasks...",
  emptyCatalog: "No tasks found",
  emptySearch: "No matching tasks",
  allLinked: "All tasks are already linked",
  noLinkedYet: "No tasks linked yet",
  unlinkTitle: "Unlink Task",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this note? The task itself will not be deleted.`,
};

/** Panel for linking/unlinking tasks to a note. */
export function TaskLinksPanel({
  noteId,
}: {
  noteId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<PickerItem, LinkedItem>
      entityId={noteId}
      labels={TASK_LINK_LABELS}
      sectionIcon={sectionIcon}
      pickerItemIcon={pickerItemIcon}
      getDeepLink={(id) => buildE2eeDeepLink("tasks", id)}
      formatName={(item) => item.title}
      useLinks={useTaskLinks}
    />
  );
}
