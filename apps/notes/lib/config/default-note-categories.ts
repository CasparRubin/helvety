/**
 * Fixed category catalog for Notes list grouping (plaintext metadata).
 * Matches Contacts-style UX with three segments: Personal, Work, Other.
 */

/** Immutable category definition used for list grouping and assignment. */
export interface DefaultNoteCategory {
  id: string;
  name: string;
  color: string;
  /** Kebab-case Lucide name; resolved by `@helvety/ui/icon-renderer` (`getLucideIcon`). */
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}

export const DEFAULT_NOTE_CATEGORIES: DefaultNoteCategory[] = [
  {
    id: "personal",
    name: "Personal",
    color: "#3b82f6",
    icon: "heart",
    sort_order: 0,
    default_rows_shown: 20,
  },
  {
    id: "work",
    name: "Work",
    color: "#f59e0b",
    icon: "briefcase",
    sort_order: 1,
    default_rows_shown: 20,
  },
  {
    id: "other",
    name: "Other",
    color: "#6b7280",
    icon: "tag",
    sort_order: 2,
    default_rows_shown: 20,
  },
];

export { DEFAULT_NOTE_CATEGORY_ID } from "@helvety/shared/e2ee-entity-defaults";

export const ALLOWED_NOTE_CATEGORY_IDS = DEFAULT_NOTE_CATEGORIES.map(
  (c) => c.id
) as [string, ...string[]];
