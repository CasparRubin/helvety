# @helvety/brand

Shared Helvety brand assets: SVG React components and canonical URL constants.

## Exports

| Import                      | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `@helvety/brand`            | Barrel re-exports                           |
| `@helvety/brand/logo`       | `HelvetyLogo` SVG component                 |
| `@helvety/brand/identifier` | Compact mark / identifier SVG               |
| `@helvety/brand/urls`       | Canonical product and legal URLs (`urls.*`) |

Used by zone app shells, `@helvety/ui`, `@helvety/extension-chrome`, and the Chromium extension (vendored via `.helvety`).

Depends on `@helvety/shared/config` for environment-aware URL helpers. Do not duplicate logo markup in individual apps; import from this package.
