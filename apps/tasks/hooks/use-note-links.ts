"use client";

import { decryptNoteDisplayTitle } from "@helvety/shared/crypto";
import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getItemNoteLinks,
  getNotes,
  linkNote,
  unlinkNote,
} from "@/app/actions/note-link-actions";

interface Note {
  id: string;
  title: string;
}

/** A linked note with link metadata for unlinking. */
export interface LinkedNote extends Note {
  /** `entity_links` row ID used for unlinking */
  link_id: string;
  linked_at: string;
}

/** Raw link row from `entity_links`. */
interface ItemNoteLinkRow {
  id: string;
  item_id: string;
  note_id: string;
  user_id: string;
  created_at: string;
}

interface NotePickerRow {
  id: string;
  encrypted_title: string;
}

const useNoteLinksHook = createE2eeEntityLinksHook<
  Note,
  LinkedNote,
  ItemNoteLinkRow
>({
  fetchMode: "eager",
  source: "tasks-use-note-links",
  messages: {
    loadLinks: "Failed to load linked notes",
    loadCatalog: "Failed to load notes",
    link: "Failed to link note",
    unlink: "Failed to unlink note",
  },
  loadCatalog: getNotes,
  loadLinks: getItemNoteLinks,
  decryptCatalog: async (data, key) =>
    Promise.all(
      (data as NotePickerRow[]).map(async (row) => ({
        id: row.id,
        title: await decryptNoteDisplayTitle(row.encrypted_title, row.id, key),
      }))
    ),
  joinLinked: (catalog, linkRows) => {
    const notesById = new Map(catalog.map((note) => [note.id, note]));
    return linkRows
      .map((linkRow) => {
        const note = notesById.get(linkRow.note_id);
        if (!note) return null;
        return {
          ...note,
          link_id: linkRow.id,
          linked_at: linkRow.created_at,
        };
      })
      .filter((note): note is LinkedNote => note !== null);
  },
  link: linkNote,
  unlink: unlinkNote,
});

/** Hook to manage note links for a task item. */
export function useNoteLinks(itemId: string, options?: { enabled?: boolean }) {
  return useNoteLinksHook(itemId, options);
}
