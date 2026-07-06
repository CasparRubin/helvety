/**
 * Canonical E2EE entity domain types (shared across web zones and extension).
 * Input types alias @helvety/shared/e2ee-create-inputs for a single source of truth.
 */

import type {
  E2eeContactCreateInput,
  E2eeLinkCreateInput,
  E2eeLinkFolderCreateInput,
  E2eeNoteCreateInput,
  E2eeTaskCreateInput,
} from "./e2ee-create-inputs";

/** Decrypted summary row for simple dropdowns (folder parent pickers). */
export interface EntityListItem {
  id: string;
  title: string;
}

/**
 *
 */
export interface TaskListRow {
  id: string;
  title: string;
  stage_id: string;
  sort_order: number;
  created_at: string;
}

/**
 *
 */
export interface NoteListRow {
  id: string;
  title: string;
  category_id: string;
  sort_order: number;
  created_at: string;
}

/**
 *
 */
export interface ContactListRow {
  id: string;
  first_name: string;
  last_name: string;
  category_id: string;
  sort_order: number;
  created_at: string;
}

/**
 *
 */
export interface LinkListRow {
  id: string;
  name: string;
  url: string;
  folder_id: string | null;
  sort_order: number;
  created_at: string;
}

/**
 *
 */
export interface LinkFolderListRow {
  id: string;
  name: string;
  parent_folder_id: string | null;
  sort_order: number;
  created_at: string;
}

/**
 *
 */
export interface Contact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  notes: string | null;
  category_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 *
 */
export type ContactInput = E2eeContactCreateInput;

/**
 *
 */
export interface Note {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 *
 */
export type NoteInput = E2eeNoteCreateInput;

/**
 *
 */
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  stage_id: string;
  label_id: string;
  priority: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 *
 */
export type TaskInput = E2eeTaskCreateInput;

/**
 *
 */
export interface Link {
  id: string;
  user_id: string;
  name: string;
  url: string;
  folder_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 *
 */
export type LinkInput = E2eeLinkCreateInput;

/**
 *
 */
export interface LinkFolder {
  id: string;
  user_id: string;
  name: string;
  parent_folder_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 *
 */
export type LinkFolderInput = E2eeLinkFolderCreateInput;

/**
 *
 */
export type EntityKind =
  "tasks" | "notes" | "contacts" | "links" | "link_folder";

/**
 *
 */
export type EntityRecord = Contact | Note | Task | Link | LinkFolder;
