/**
 * E2EE form draft validation and helpers (shared across web zones and extension).
 */

import {
  emptyContactInput,
  emptyLinkFolderInput,
  emptyLinkInput,
  emptyNoteInput,
  emptyTaskInput,
} from "./e2ee-create-inputs";

import type {
  ContactInput,
  EntityKind,
  LinkFolderInput,
  LinkInput,
  NoteInput,
  TaskInput,
} from "./e2ee-domain-types";

/** Discriminated union for in-progress E2EE entity forms. */
export type E2eeFormDraft =
  | { kind: "tasks"; value: TaskInput }
  | { kind: "notes"; value: NoteInput }
  | { kind: "contacts"; value: ContactInput }
  | { kind: "links"; value: LinkInput }
  | { kind: "link_folder"; value: LinkFolderInput };

/** Empty form draft for a new entity of the given kind. */
export function draftForKind(kind: EntityKind): E2eeFormDraft {
  switch (kind) {
    case "tasks":
      return { kind: "tasks", value: emptyTaskInput() };
    case "notes":
      return { kind: "notes", value: emptyNoteInput() };
    case "contacts":
      return { kind: "contacts", value: emptyContactInput() };
    case "links":
      return { kind: "links", value: emptyLinkInput() };
    case "link_folder":
      return { kind: "link_folder", value: emptyLinkFolderInput() };
  }
}

/** Stable JSON snapshot for unsaved-changes detection. */
export function serializeFormDraft(draft: E2eeFormDraft): string {
  return JSON.stringify(draft);
}

/** Returns a validation error message or null when the draft can be saved. */
export function validateE2eeDraft(draft: E2eeFormDraft): string | null {
  switch (draft.kind) {
    case "tasks":
      return draft.value.title.trim() ? null : "Title is required.";
    case "notes":
      return draft.value.title.trim() ? null : "Title is required.";
    case "contacts":
      return draft.value.first_name.trim() ? null : "First name is required.";
    case "links":
      if (!draft.value.name.trim()) {
        return "Name is required.";
      }
      return draft.value.url.trim() ? null : "URL is required.";
    case "link_folder":
      return draft.value.name.trim() ? null : "Folder name is required.";
  }
}
