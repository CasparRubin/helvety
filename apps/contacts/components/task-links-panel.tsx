"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";
import { ListChecksIcon } from "lucide-react";

import { useTaskLinks } from "@/hooks/use-task-links";

import type { LinkedItem, PickerItem } from "@/lib/types";

const TASK_LINK_LABELS = {
  sectionTitle: "Linked Tasks",
  searchPlaceholder: "Search tasks...",
  emptyCatalog: "No tasks found",
  emptySearch: "No matching tasks",
  allLinked: "All tasks are already linked",
  noLinkedYet: "No tasks linked yet",
  unlinkTitle: "Unlink Task",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this contact? The task itself will not be deleted.`,
};

/** Panel for linking/unlinking tasks to a contact. */
export function TaskLinksPanel({
  contactId,
}: {
  contactId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<PickerItem, LinkedItem>
      entityId={contactId}
      labels={TASK_LINK_LABELS}
      sectionIcon={ListChecksIcon}
      pickerItemIcon={ListChecksIcon}
      getDeepLink={(id) => buildE2eeDeepLink("tasks", id)}
      formatName={(item) => item.title}
      useLinks={useTaskLinks}
    />
  );
}
