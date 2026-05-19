import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";

/** Props for {@link HelvetyThemeInitScript}. */
export type HelvetyThemeInitScriptProps = Readonly<{
  nonce?: string;
}>;

/**
 * Blocking theme init script for app shells. Place immediately after
 * {@link SkipToContent} so `html.dark` is correct before the first paint.
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
