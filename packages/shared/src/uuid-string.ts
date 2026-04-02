/**
 * UUID string validation shared by server actions and `entity-links`.
 * Matches Postgres-compatible UUID syntax with RFC 4122 variant/version nibbles.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns whether `value` is a syntactically valid UUID for ID parameters and DB keys.
 *
 * @param value - Candidate string (e.g. route or server action argument).
 * @returns True when the string matches the canonical UUID pattern.
 */
export function isUuidString(value: string): boolean {
  return UUID_REGEX.test(value);
}
