/**
 * Helpers for E2EE list dashboards: display titles and pristine-draft detection
 * when closing a detail sheet without edits.
 */

/** Fallback list label when a note or task title is empty. */
export const E2EE_LIST_UNTITLED_LABEL = "Untitled";

/** Returns a display title for list rows, using a fallback when empty. */
export function getE2eeListTitle(
  title: string,
  fallback = E2EE_LIST_UNTITLED_LABEL
): string {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Shallow equality for draft cleanup: all keys in `snapshot` match `current`.
 */
export function isDraftSnapshotUnchanged<T extends Record<string, unknown>>(
  current: T,
  snapshot: T
): boolean {
  for (const key of Object.keys(snapshot) as (keyof T)[]) {
    if (current[key] !== snapshot[key]) {
      return false;
    }
  }
  return true;
}
