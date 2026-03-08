/**
 * Fixed category catalog for Contacts.
 * Categories are immutable and defined in code.
 */

/** Immutable category definition used for list grouping and assignment. */
export interface DefaultCategory {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: "personal", name: "Personal", color: "#3b82f6", sort_order: 0 },
  { id: "family", name: "Family", color: "#10b981", sort_order: 1 },
  { id: "work", name: "Work", color: "#f59e0b", sort_order: 2 },
  { id: "business", name: "Business", color: "#8b5cf6", sort_order: 3 },
  { id: "other", name: "Other", color: "#6b7280", sort_order: 4 },
];

export const DEFAULT_CONTACT_CATEGORY_ID = "personal";

export const ALLOWED_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id) as [
  string,
  ...string[],
];
