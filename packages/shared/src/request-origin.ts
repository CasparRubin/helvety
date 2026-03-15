/**
 * Resolve public request origin from request headers.
 *
 * Works for local development (host header with port) and for deployments
 * behind proxies (x-forwarded-* headers).
 */
export function resolveRequestOrigin(headers: Headers): string | null {
  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");
  const host = headers.get("host");

  const protocol = forwardedProto?.split(",")[0]?.trim() ?? "http";
  const hostname = forwardedHost?.split(",")[0]?.trim() ?? host?.trim();
  if (!hostname) {
    return null;
  }

  try {
    return new URL(`${protocol}://${hostname}`).origin;
  } catch {
    return null;
  }
}
