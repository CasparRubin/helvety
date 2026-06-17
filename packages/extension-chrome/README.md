# @helvety/extension-chrome

Shared **Chromium extension UI chrome** for Helvety products: CSP-safe theme boot, local light/dark preference, shell layout helpers, header row, and scroll/choice utilities.

Used by:

- [helvety-browser-extension-chromium](https://github.com/CasparRubin/helvety-browser-extension-chromium) — Chromium **side panel** (full viewport height; does not use `POPUP_WIDTH_CLASS`)
- [power-platform-configurator-browser-extension-chromium](https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium) — action **popup** at Chrome’s 800×600 maximum ([Chrome Web Store](https://chromewebstore.google.com/detail/power-platform-configurat/mdneakhceachnimmejciaehnfjfabang)); uses `POPUP_WIDTH_CLASS` (`w-[800px]`)

## Exports

| Subpath                              | Purpose                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `theme-boot`                         | Sync import at extension UI entry (OS `prefers-color-scheme` before React)               |
| `theme-preference`                   | Parse/apply `light` / `dark` only (invalid stored values → OS default); no `next-themes` |
| `use-popup-theme`                    | React hook + `chrome.storage.local` persistence                                          |
| `popup-shell`                        | `POPUP_WIDTH_CLASS` (800px popups), `POPUP_SHELL_CLASS`, tab scroll, choice row classes  |
| `popup-header`                       | Product name + icon + optional version row                                               |
| `helvety-mark`                       | About **Developer** section mark                                                         |
| `popup.css` / `extension-tokens.css` | Shared extension Tailwind utilities                                                      |

Each extension passes its own **storage key** (for example `popupThemePreference` vs `helvetyPopupThemePreference`) and icon URL into the wrappers in its UI module (for example `src/popup/components/` in consumer repos).

## Tests

```bash
bun run test
```

Vitest suites live under `src/*.test.ts` (theme preference, popup shell).
