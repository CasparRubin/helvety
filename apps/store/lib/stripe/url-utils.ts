/**
 * Append a query parameter to URL while preserving existing querystring safely.
 */
export function appendQueryParam(
  url: string,
  key: string,
  value: string
): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
