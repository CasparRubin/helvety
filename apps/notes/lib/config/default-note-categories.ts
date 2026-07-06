/**
 * Fixed category catalog for Notes list grouping (plaintext metadata).
 * Matches Contacts-style UX with three segments: Personal, Work, Other.
 */

import {
  NOTE_CATEGORIES,
  type CatalogEntry,
} from "@helvety/shared/e2ee-entity-catalogs";

/** Immutable category definition used for list grouping and assignment. */
export type DefaultNoteCategory = CatalogEntry;

export const DEFAULT_NOTE_CATEGORIES: DefaultNoteCategory[] = NOTE_CATEGORIES;

export { DEFAULT_NOTE_CATEGORY_ID } from "@helvety/shared/e2ee-entity-defaults";

export const ALLOWED_NOTE_CATEGORY_IDS = DEFAULT_NOTE_CATEGORIES.map(
  (c) => c.id
) as [string, ...string[]];
