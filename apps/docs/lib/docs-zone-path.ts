/**
 * Gateway-visible paths for the Docs zone (`basePath: /docs` in `next.config.ts`).
 *
 * - {@link buildDocsPublicPath}: `getLoginUrl` return paths; repairs `usePathname()` (no `/docs` prefix).
 * - {@link getDocsApiPath}: browser `fetch` to `/docs/api/...` (`fetch` does not apply Next `basePath`).
 *
 * Inside the docs app, use zone-relative paths for `router.replace` and `<Link href>` (`/`, `/?doc=…`).
 * `?doc=` is a vault bookmark id (URL sync when the user opens/saves from the sidebar), not an
 * auto-open deep link on load; the editor starts blank. See `helvety-docs-shell.tsx`.
 * Do not pass `/docs` to the App Router or navigation becomes `/docs/docs`.
 */

/** Public URL prefix for the docs zone (gateway-visible path). */
export const DOCS_BASE_PATH = "/docs";

/**
 * Build a gateway-visible docs path for auth redirects.
 * `usePathname()` inside a basePath app omits `/docs`; this restores it.
 */
export function buildDocsPublicPath(pathname: string, query = ""): string {
  const path =
    pathname === "/" ? DOCS_BASE_PATH : `${DOCS_BASE_PATH}${pathname}`;
  return query ? `${path}?${query}` : path;
}

/**
 * Prefix API paths for browser `fetch` (does not apply Next `basePath`).
 * Example: `getDocsApiPath("/api/docs")` → `/docs/api/docs`.
 */
export function getDocsApiPath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Docs API path must start with /: ${path}`);
  }
  return `${DOCS_BASE_PATH}${path}`;
}
