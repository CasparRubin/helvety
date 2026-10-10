"use client";

import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";

/**
 * Blocking theme init for `<head>` (before body paint). Server emits
 * `text/javascript`; client uses `text/plain` so React 19 does not warn.
 * `script-src` allows this inline script with `'unsafe-inline'`.
 */
export function HelvetyThemeInitScript(): React.JSX.Element {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getHelvetyThemeInitScript() }}
    />
  );
}
