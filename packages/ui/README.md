# @helvety/ui

Shared React UI components and app-shell primitives for Helvety web apps in this monorepo (helvety.com).

**Current zones:** `web`, `store`, `pdf`, `image-editor`, `ocr`.

## Scope

This package provides:

- Shared design system and utility components
- Theme and layout helpers
- **Public** app root shell (`HelvetyPublicShellRootLayout`): `web`, `store`, `pdf`, `image-editor`, and `ocr` share CSP nonce, JSON-LD, blocking `HelvetyThemeInitScript` in `<head>`, theme (`ThemeProvider`), `TooltipProvider`, optional `wrapInsideTooltipProvider`, navbar slot, main region, [`Footer`](./src/footer.tsx), and toaster. Store uses `themeProviderScope: "navbar-only"`. For `mainVariant: "scroll-area"`, page content scrolls inside the shared **`ScrollArea`**; optional **`scrollAreaMainPrefix`** (Store `StoreNav`, solid `CommandBar`) stays pinned above that scroll region. Public tools use `mainVariant: "overflow-main"` so command bars pin as flex siblings above an `overflow-hidden` workspace.
- Shared top navigation chrome (`HelvetyShellNavbar`) across public zones.
- Cross-app navigation: **`AppSwitcher`** reads product sections from `@helvety/shared/helvety-ecosystem-sections` via [`app-switcher-sections.tsx`](src/app-switcher-sections.tsx) and passes **absolute** `urls.*` hrefs into **`next/link`**, so each zone’s Next **`basePath`** does not rewrite links to other apps. Core Apps **Store** uses **`urls.storeProducts`**. The switcher sheet uses **`SHEET_SCROLLABLE_SHELL_CLASS`** and scrolls long link lists in **`ScrollArea`**.

## Key Exports

**Public zones (`web`, `store`, `pdf`, `image-editor`, `ocr`):**

- `@helvety/ui/helvety-public-shell-root-layout` -> `HelvetyPublicShellRootLayout`
- `@helvety/ui/command-bar` -> `CommandBar` (pinned shell; parents place it outside scroll). User-facing copy says **command bar** (see [`docs/ui-action-button-contract.md`](../../docs/ui-action-button-contract.md)).
- `@helvety/ui/helvety-shell-route-loading` -> `HelvetyShellRouteLoading` for root `app/loading.tsx` on **`web`** and **`store`**
- `@helvety/ui/loading-spinner` -> `LoadingSpinner` for root `app/loading.tsx` on **pdf**, **image-editor**, and **ocr**
- `@helvety/ui/create-app-navbar` -> `createPublicShellNavbar`, `publicToolNavbarBrand`
- `@helvety/ui/public-tool-workspace` -> layout class strings for PDF, image-editor, and OCR sidebars/canvas shells
- `@helvety/ui/sonner` -> `Toaster`, `toast` (zone apps import here; do not depend on `sonner` directly)
- `@helvety/ui/sheet-scroll-layout` -> `SHEET_SCROLLABLE_SHELL_CLASS`, `SHEET_SCROLLABLE_BODY_CLASS`
- `@helvety/ui/accessible-sheet-header` -> `AccessibleSheetHeader`
- `@helvety/ui/input`, `@helvety/ui/textarea`, `@helvety/ui/native-select`
- `@helvety/ui/helvety-shell-navbar` -> `HelvetyShellNavbar`
- `@helvety/ui/footer` -> `Footer` (copyright + legal nav; contact is in the About dialog; storage disclosure is Privacy §8 only)

Also includes reusable UI building blocks (Base UI / shadcn `base-vega`, table, dialog, sheet, CommandBar toolbar shells).

## Styling / Tailwind

- **`globals.css`** (`@helvety/ui/globals.css`): semantic design tokens and Tailwind v4 imports for every zone app. Imports **`form-control-touch.css`**. Shared **`.processing-shine`** for public-tool processing labels (OCR, image-editor). Marketing accents include **`--brand-swiss-red`**.
- **PostCSS at build time:** zone apps re-export [`@helvety/config/postcss`](../config/postcss.mjs). This package declares **`tailwindcss`** and **`@tailwindcss/postcss`** in **`dependencies`**. See [`docs/vercel-monorepo-apps.md`](../../docs/vercel-monorepo-apps.md).

## Testing

```bash
bun run test --filter=@helvety/ui
```

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- UI/shadcn integration policy: [`docs/ui-shadcn-integration-policy.md`](../../docs/ui-shadcn-integration-policy.md)
- Shared backend package: [`packages/shared/README.md`](../shared/README.md)
