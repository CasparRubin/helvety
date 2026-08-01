"use client";

import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";

/** Props for {@link HelvetyThemeInitScript}. */
export type HelvetyThemeInitScriptProps = Readonly<{
  nonce?: string;
}>;

/**
 * Blocking theme init for `<head>` (before body paint). Server emits
 * `text/javascript`; client uses `text/plain` so React 19 does not warn.
 */
export function HelvetyThemeInitScript({
  nonce,
}: HelvetyThemeInitScriptProps): React.JSX.Element {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getHelvetyThemeInitScript() }}
    />
  );
}
