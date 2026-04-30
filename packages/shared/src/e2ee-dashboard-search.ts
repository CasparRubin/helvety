import { matchesClientSearch } from "./client-search";

/** Shared client-side search filter for E2EE list dashboards. */
export function filterE2eeDashboardItems<T>(
  items: T[],
  searchQuery: string,
  getSearchableFields: (item: T) => string[]
): T[] {
  const query = searchQuery.trim();
  if (!query) return items;
  return items.filter((item) =>
    matchesClientSearch(getSearchableFields(item), query)
  );
}

/** Shared empty-search helper used by E2EE dashboards. */
export function resolveE2eeEmptySearchMessage(options: {
  searchQuery: string;
  totalCount: number;
  filteredCount: number;
  emptyMessage: string;
}): string | undefined {
  const { searchQuery, totalCount, filteredCount, emptyMessage } = options;
  const isSearchActive = searchQuery.trim() !== "";
  return isSearchActive && totalCount > 0 && filteredCount === 0
    ? emptyMessage
    : undefined;
}
