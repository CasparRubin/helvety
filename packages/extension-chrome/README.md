# @helvety/extension-chrome

Shared **Chromium extension UI chrome** for Helvety products: CSP-safe theme boot, local light/dark preference, shell layout helpers, header row, and scroll/choice utilities.

Used by external Chromium extension repositories that depend on this monorepo package, including:

- [power-platform-configurator-browser-extension-chromium](https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium) (action popup; Chrome Web Store listing for Power Platform Configurator)

This package is for external Chromium extension repos (for example Power Platform Configurator). It is not a Helvety.com web zone.

## Exports

| Subpath                              | Purpose                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `theme-boot`                         | Sync import at extension UI entry (OS `prefers-color-scheme` before React)                         |
| `theme-preference`                   | Parse/apply `light` / `dark` only (invalid stored values → OS default); no `next-themes`           |
| `use-popup-theme`                    | React hook + `chrome.storage.local` persistence                                                    |
| `popup-shell`                        | `POPUP_WIDTH_CLASS` (800px popups), `POPUP_SHELL_CLASS`, tab scroll, choice row classes            |
| `popup-header`                       | Product name + icon + optional version row                                                         |
| `helvety-mark`                       | About **Developer** section mark                                                                   |
| `extension-version`                  | `readExtensionVersion()` / `readExtensionId()` from the Chromium manifest                          |
| `popup.css` / `extension-tokens.css` | Shared extension Tailwind utilities (OKLCH design tokens; scrollbars use `color-mix(in oklch, …)`) |

Each extension passes its own **storage key** and icon URL into the wrappers in its UI module.

## Tests

```bash
bun run test
```

Vitest suites live under `src/*.test.ts` and `src/*.test.tsx` (theme preference, theme boot, popup shell, popup header, helvety mark, popup theme hook, extension version).
