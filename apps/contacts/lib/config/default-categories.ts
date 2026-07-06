/**
 * Fixed category catalog for Contacts.
 * Categories are immutable and defined in code.
 */

import {
  CONTACT_CATEGORIES,
  type CatalogEntry,
} from "@helvety/shared/e2ee-entity-catalogs";

/** Immutable category definition used for list grouping and assignment. */
export type DefaultCategory = CatalogEntry;

export const DEFAULT_CATEGORIES: DefaultCategory[] = CONTACT_CATEGORIES;

export { DEFAULT_CONTACT_CATEGORY_ID } from "@helvety/shared/e2ee-entity-defaults";

export const ALLOWED_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id) as [
  string,
  ...string[],
];
