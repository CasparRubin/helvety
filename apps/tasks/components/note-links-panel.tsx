"use client";

import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { EntityLinksPanel } from "@helvety/ui/entity-links-panel";
import { FileTextIcon, NotebookPenIcon } from "lucide-react";

import { useNoteLinks } from "@/hooks/use-note-links";

import type { LinkedNote } from "@/hooks/use-note-links";

/** @deprecated Import from `@helvety/shared/e2ee-deep-link` */
export function getNoteDeepLink(noteId: string): string {
  return buildE2eeDeepLink("notes", noteId);
}

/** Adapts `useNoteLinks` to the shared entity links panel hook shape. */
function useNoteLinksAdapter(entityId: string, options: { enabled: boolean }) {
  const { allNotes, linkedNotes, isLoading, link, unlink } = useNoteLinks(
    entityId,
    options
  );
  return {
    allItems: allNotes,
    linkedItems: linkedNotes,
    isLoading,
    link,
    unlink,
  };
}

const NOTE_LINK_LABELS = {
  sectionTitle: "Linked Notes",
  searchPlaceholder: "Search notes...",
  emptyCatalog: "No notes found",
  emptySearch: "No matching notes",
  allLinked: "All notes are already linked",
  noLinkedYet: "No notes linked yet",
  unlinkTitle: "Unlink Note",
  unlinkDescription: (name: string) =>
    `Are you sure you want to unlink "${name}" from this task? The note itself will not be deleted.`,
};

/** Panel for linking/unlinking notes to a task. */
export function NoteLinksPanel({
  itemId,
}: {
  itemId: string;
}): React.JSX.Element {
  return (
    <EntityLinksPanel<{ id: string; title: string }, LinkedNote>
      entityId={itemId}
      labels={NOTE_LINK_LABELS}
      sectionIcon={NotebookPenIcon}
      pickerItemIcon={FileTextIcon}
      getDeepLink={(id) => buildE2eeDeepLink("notes", id)}
      formatName={(note) => note.title}
      useLinks={useNoteLinksAdapter}
    />
  );
}
