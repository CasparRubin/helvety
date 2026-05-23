/** App zone path prefixes used when leaving the gateway home (`/`). */
const GATEWAY_CROSS_ZONE_PREFIXES = [
  "/store",
  "/pdf",
  "/docs",
  "/image-upscaler",
  "/auth",
  "/tasks",
  "/contacts",
  "/notes",
  "/links",
] as const;

/** True when `pathname` is a gateway cross-zone app root or subpath. */
function pathMatchesZonePrefix(pathname: string): boolean {
  return GATEWAY_CROSS_ZONE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Helvety production/local hosts for absolute AppSwitcher links. */
function isHelvetyHostedUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host === "helvety.com" ||
    host.endsWith(".helvety.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

/**
 * True when `href` navigates away from the gateway to another Helvety zone
 * (relative `/store`, same-origin `/pdf`, or absolute helvety.com/store, etc.).
 */
export function isGatewayCrossZoneHref(href: string): boolean {
  if (!href || href.startsWith("#")) {
    return false;
  }

  if (href.startsWith("/")) {
    const pathname = href.split("?")[0]?.split("#")[0] ?? href;
    return pathMatchesZonePrefix(pathname);
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    if (url.origin !== window.location.origin && !isHelvetyHostedUrl(url)) {
      return false;
    }
    return pathMatchesZonePrefix(url.pathname);
  } catch {
    return false;
  }
}
