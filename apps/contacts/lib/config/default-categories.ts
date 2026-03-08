/**
 * Fixed category catalog for Contacts.
 * Categories are immutable and defined in code.
 */

/** Immutable category definition used for list grouping and assignment. */
export interface DefaultCategory {
  id: string;
  name: string;
  color: string;
  /** Lucide icon name used in category headers and selectors. */
  icon: string;
  sort_order: number;
  default_rows_shown: number;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    id: "personal",
    name: "Personal",
    color: "#3b82f6",
    icon: "heart",
    sort_order: 0,
    default_rows_shown: 20,
  },
  {
    id: "family",
    name: "Family",
    color: "#10b981",
    icon: "home",
    sort_order: 1,
    default_rows_shown: 20,
  },
  {
    id: "work",
    name: "Work",
    color: "#f59e0b",
    icon: "briefcase",
    sort_order: 2,
    default_rows_shown: 20,
  },
  {
    id: "business",
    name: "Business",
    color: "#8b5cf6",
    icon: "database",
    sort_order: 3,
    default_rows_shown: 20,
  },
  {
    id: "other",
    name: "Other",
    color: "#6b7280",
    icon: "tag",
    sort_order: 4,
    default_rows_shown: 5,
  },
];

export const DEFAULT_CONTACT_CATEGORY_ID = "personal";

export const ALLOWED_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id) as [
  string,
  ...string[],
];
