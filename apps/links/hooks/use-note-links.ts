"use client";

import { decryptNoteDisplayTitle } from "@helvety/shared/crypto";
import { createE2eeEntityLinksHook } from "@helvety/ui/create-e2ee-entity-links-hook";

import {
  getLinkNoteLinks,
  getNoteEntities,
  linkNoteEntity,
  unlinkNoteEntity,
} from "@/app/actions/note-link-actions";

export interface LinkedNote {
  id: string;
  title: string;
  link_id: string;
  linked_at: string;
}

export interface PickerNote {
  id: string;
  title: string;
}

interface NoteLinkData {
  notes: {
    id: string;
    encrypted_title: string;
    link_id: string;
    linked_at: string;
  }[];
}

interface NoteEntitiesData {
  notes: { id: string; encrypted_title: string }[];
}

const useNoteLinksHook = createE2eeEntityLinksHook<
  PickerNote,
  LinkedNote,
  { id: string },
  NoteLinkData,
  NoteEntitiesData
>({
  fetchMode: "lazyCatalog",
  source: "links-use-note-links",
  messages: {
    loadLinks: "Failed to load note links",
    loadCatalog: "Failed to load notes",
    link: "Failed to link note",
    unlink: "Failed to unlink note",
  },
  loadLinks: getLinkNoteLinks,
  loadCatalog: getNoteEntities,
  decryptLinked: async (data, key) =>
    Promise.all(
      data.notes.map(async (note) => ({
        id: note.id,
        title: await decryptNoteDisplayTitle(
          note.encrypted_title,
          note.id,
          key
        ),
        link_id: note.link_id,
        linked_at: note.linked_at,
      }))
    ),
  decryptCatalog: async (data, key) =>
    Promise.all(
      data.notes.map(async (note) => ({
        id: note.id,
        title: await decryptNoteDisplayTitle(
          note.encrypted_title,
          note.id,
          key
        ),
      }))
    ),
  link: (linkId, noteId, csrfToken) =>
    linkNoteEntity(noteId, linkId, csrfToken),
  unlink: unlinkNoteEntity,
});

/** Hook to fetch, decrypt, link, and unlink notes for a bookmark. */
export function useNoteLinks(linkId: string, options?: { enabled?: boolean }) {
  return useNoteLinksHook(linkId, options);
}
