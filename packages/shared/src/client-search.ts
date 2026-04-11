/**
 * Client-only list filtering helpers (E2EE apps: run on decrypted data in the browser).
 * Normalized substring match with multi-token AND (each whitespace-separated token must appear).
 */

/** Lowercase, NFKC, collapse internal whitespace, trim. */
export function normalizeForClientSearch(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Non-empty normalized tokens from a user query. */
export function tokenizeClientSearchQuery(query: string): string[] {
  const n = normalizeForClientSearch(query);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

/**
 * Returns true if every query token is a substring of the combined normalized haystack.
 * Empty or whitespace-only query matches everything.
 */
export function matchesClientSearch(
  haystackParts: string[],
  query: string
): boolean {
  const tokens = tokenizeClientSearchQuery(query);
  if (tokens.length === 0) return true;
  const haystack = normalizeForClientSearch(haystackParts.join(" "));
  return tokens.every((t) => haystack.includes(t));
}
