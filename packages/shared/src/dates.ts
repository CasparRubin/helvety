/**
 * Date formatting utilities.
 * All dates are displayed in the Europe/Zurich (Swiss) timezone.
 * Invalid or empty ISO strings return an em dash (`—`) instead of throwing.
 */

/** Swiss timezone identifier (covers Bern, Zurich, Basel, etc.) */
const TIMEZONE = "Europe/Zurich";

/** Fallback when the input is missing or not a valid instant. */
const INVALID_DATE_FALLBACK = "—";

/**
 * Formats an ISO date string to dd.MM.yyyy HH:mm in the Swiss timezone.
 *
 * @param isoString - ISO 8601 date string (e.g. from Supabase timestamptz)
 * @returns Formatted date string, e.g. "07.02.2026 14:30", or "—" when invalid
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return INVALID_DATE_FALLBACK;
  }
  const formatter = new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
  // Intl returns "07.02.2026, 14:30" for de-CH so we strip the comma
  return formatter.format(date).replace(",", "");
}
