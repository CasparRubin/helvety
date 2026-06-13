import {
  Link2Icon,
  ListTodoIcon,
  NotebookPenIcon,
  UsersIcon,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

/** Target E2EE app for cross-app entity link panels. */
export type E2eeLinkTargetApp = "notes" | "tasks" | "contacts" | "links";

/** Shared section title and icons for link panels (matches app switcher). */
export type E2eeAppLinkUi = {
  sectionTitle: string;
  sectionIcon: LucideIcon;
  pickerItemIcon: LucideIcon;
};

/** Canonical link panel UI per target app. */
export const E2EE_APP_LINK_UI: Record<E2eeLinkTargetApp, E2eeAppLinkUi> = {
  notes: {
    sectionTitle: "Notes",
    sectionIcon: NotebookPenIcon,
    pickerItemIcon: NotebookPenIcon,
  },
  tasks: {
    sectionTitle: "Tasks",
    sectionIcon: ListTodoIcon,
    pickerItemIcon: ListTodoIcon,
  },
  contacts: {
    sectionTitle: "Contacts",
    sectionIcon: UsersIcon,
    pickerItemIcon: UsersIcon,
  },
  links: {
    sectionTitle: "Links",
    sectionIcon: Link2Icon,
    pickerItemIcon: Link2Icon,
  },
};
