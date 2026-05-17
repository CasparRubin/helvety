/**
 * Referer regex for Vercel Analytics `/<id>/script.js` gateway proxying.
 * Allows optional subpath, query string, or hash after the zone path (e.g. `/links?link=uuid`).
 */
export function zoneAnalyticsReferer(zonePath: string): string {
  return `.*/${zonePath}(?:/.*)?(?:[?#].*)?$`;
}
