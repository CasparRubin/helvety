/**
 * Helpers for E2EE list dashboards: display titles for decrypted list rows.
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
