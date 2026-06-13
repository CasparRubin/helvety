"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { E2EE_APP_LINK_UI } from "@helvety/ui/e2ee-app-link-ui";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";

import { useNoteLinks } from "@/hooks/use-note-links";

import type { LinkedNote, PickerNote } from "@/hooks/use-note-links";

const { sectionTitle, sectionIcon, pickerItemIcon } = E2EE_APP_LINK_UI.notes;

const NOTE_LINK_LABELS = {
  sectionTitle,
  searchPlaceholder: "Search notes...",
  emptyCatalog: "No notes found",
  emptySearch: "No matching notes",
  allLinked: "All notes are already linked",
  noLinkedYet: "No notes linked yet",
  unlinkTitle: "Unlink Note",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this link? The note itself will not be deleted.`,
};

/** Panel for linking/unlinking notes to a bookmark. */
export function NoteLinksPanel({
  linkId,
}: {
  linkId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<PickerNote, LinkedNote>
      entityId={linkId}
      labels={NOTE_LINK_LABELS}
      sectionIcon={sectionIcon}
      pickerItemIcon={pickerItemIcon}
      getDeepLink={(id) => buildE2eeDeepLink("notes", id)}
      formatName={(note) => note.title}
      useLinks={useNoteLinks}
    />
  );
}
