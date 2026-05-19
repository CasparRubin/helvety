import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";

/** Props for {@link HelvetyThemeInitScript}. */
export type HelvetyThemeInitScriptProps = Readonly<{
  nonce?: string;
}>;

/**
 * Blocking theme init script for app shells. Render in `<head>` so `html.dark`
 * and semantic tokens are correct before `<body>` / `bg-background` paint.
 */
export function HelvetyThemeInitScript({
  nonce,
}: HelvetyThemeInitScriptProps): React.JSX.Element {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: getHelvetyThemeInitScript() }}
    />
  );
}
