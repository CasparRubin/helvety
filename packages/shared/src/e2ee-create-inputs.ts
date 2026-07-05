/**
 * Empty create-form defaults for E2EE entities (shared across web zones and extension).
 */

import {
  DEFAULT_CONTACT_CATEGORY_ID,
  DEFAULT_NOTE_CATEGORY_ID,
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STAGE_ID,
} from "./e2ee-entity-defaults";

/** Contact fields submitted on create/update. */
export interface E2eeContactCreateInput {
  first_name: string;
  last_name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  birthday?: string | null;
  notes?: string | null;
  category_id?: string;
}

/** Note fields submitted on create/update. */
export interface E2eeNoteCreateInput {
  title: string;
  description?: string | null;
  category_id?: string;
}

/** Task fields submitted on create/update. */
export interface E2eeTaskCreateInput {
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stage_id?: string;
  /** Null means unset; server coalesces to DEFAULT_TASK_LABEL_ID on insert. */
  label_id?: string | null;
  priority?: number;
}

/** Link fields submitted on create/update. */
export interface E2eeLinkCreateInput {
  name: string;
  url: string;
  folder_id?: string | null;
}

/** Link folder fields submitted on create/update. */
export interface E2eeLinkFolderCreateInput {
  name: string;
  parent_folder_id?: string | null;
}

/** Empty contact form for save-first create. */
export function emptyContactInput(): E2eeContactCreateInput {
  return {
    first_name: "",
    last_name: "",
    description: null,
    email: null,
    phone: null,
    birthday: null,
    notes: null,
    category_id: DEFAULT_CONTACT_CATEGORY_ID,
  };
}

/** Empty note form for save-first create. */
export function emptyNoteInput(): E2eeNoteCreateInput {
  return {
    title: "",
    description: null,
    category_id: DEFAULT_NOTE_CATEGORY_ID,
  };
}

/** Empty task form for save-first create. */
export function emptyTaskInput(): E2eeTaskCreateInput {
  return {
    title: "",
    description: null,
    start_date: null,
    end_date: null,
    stage_id: DEFAULT_TASK_STAGE_ID,
    label_id: null,
    priority: DEFAULT_TASK_PRIORITY,
  };
}

/** Empty link form for save-first create. */
export function emptyLinkInput(): E2eeLinkCreateInput {
  return { name: "", url: "", folder_id: null };
}

/** Empty link folder form for save-first create. */
export function emptyLinkFolderInput(): E2eeLinkFolderCreateInput {
  return { name: "", parent_folder_id: null };
}
