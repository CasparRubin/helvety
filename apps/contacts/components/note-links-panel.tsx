"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";
import { FileTextIcon } from "lucide-react";

import { useNoteLinks } from "@/hooks/use-note-links";

import type { LinkedNote, PickerNote } from "@/hooks/use-note-links";

const NOTE_LINK_LABELS = {
  sectionTitle: "Linked Notes",
  searchPlaceholder: "Search notes...",
  emptyCatalog: "No notes found",
  emptySearch: "No matching notes",
  allLinked: "All notes are already linked",
  noLinkedYet: "No notes linked yet",
  unlinkTitle: "Unlink Note",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this contact? The note itself will not be deleted.`,
};

/** Panel for linking/unlinking notes to a contact. */
export function NoteLinksPanel({
  contactId,
}: {
  contactId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<PickerNote, LinkedNote>
      entityId={contactId}
      labels={NOTE_LINK_LABELS}
      sectionIcon={FileTextIcon}
      pickerItemIcon={FileTextIcon}
      getDeepLink={(id) => buildE2eeDeepLink("notes", id)}
      formatName={(note) => note.title}
      useLinks={useNoteLinks}
    />
  );
}
