/** Shared UTC formatter; constructing Intl formatters is comparatively expensive. */
const RELEASE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats YYYY-MM-DD for store UI (UTC calendar date, hydration-safe). */
export function formatStoreReleaseDate(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d)
  ) {
    return isoDate;
  }
  return RELEASE_DATE_FORMATTER.format(new Date(Date.UTC(y, m - 1, d)));
}
