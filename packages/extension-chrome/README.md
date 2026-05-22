# @helvety/extension-chrome

Shared **Chromium extension popup chrome** for Helvety products: CSP-safe theme boot, local light/dark preference, 320px popup shell layout, header row, and scroll/choice utilities.

Used by:

- [helvety-browser-extension-chromium](https://github.com/CasparRubin/helvety-browser-extension-chromium)
- [power-platform-configurator-browser-extension-chromium](https://github.com/CasparRubin/power-platform-configurator-browser-extension-chromium)

## Exports

| Subpath | Purpose |
| ------- | ------- |
| `theme-boot` | Sync import at popup entry (OS `prefers-color-scheme` before React) |
| `theme-preference` | Parse/apply light/dark; no `next-themes` |
| `use-popup-theme` | React hook + `chrome.storage.local` persistence |
| `popup-shell` | `POPUP_WIDTH_CLASS`, tab panel scroll, choice row classes |
| `popup-header` | Product name + icon + optional version row |
| `helvety-mark` | About **Developer** section mark |
| `popup.css` / `extension-tokens.css` | Shared popup Tailwind utilities |

Each extension passes its own **storage key** (for example `popupThemePreference` vs `helvetyPopupThemePreference`) and icon URL into the wrappers in `src/popup/components/`.

## Tests

```bash
bun run test
```

Vitest suites live under `src/*.test.ts` (theme preference, popup shell).
