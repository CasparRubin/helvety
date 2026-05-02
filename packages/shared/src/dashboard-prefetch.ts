/**
 * Shared helpers for E2EE dashboard prefetch server actions that fetch
 * `MAX_DASHBOARD_ROWS + 1` rows to detect overflow, plus the same user-facing
 * copy for the contacts list API route when its separate cap is exceeded.
 */

/** User-facing error when a dashboard list exceeds the configured cap. */
export const DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR =
  "Too many items to load in one request" as const;

/** Contacts dashboard / API when the over-fetch returns one row past the cap. */
export const CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR =
  "Too many contacts to load in one request" as const;

/**
 * True when `rowCount` is strictly greater than `maxRows` (the allowed
 * maximum), i.e. the query used `maxRows + 1` and returned one extra row.
 */
export function isDashboardPrefetchOverCap(
  rowCount: number,
  maxRows: number
): boolean {
  return rowCount > maxRows;
}
