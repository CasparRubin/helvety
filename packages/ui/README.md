# @helvety/ui

Shared React UI components and app-shell primitives for Helvety web apps in this monorepo (helvety.com).

## Scope

This package provides:

- Shared design system and utility components
- Theme and layout helpers
- **Public** app root shell (`HelvetyPublicShellRootLayout`): `web`, `auth`, `store`, `pdf`, `image-upscaler`, and `image-editor` share CSP nonce, JSON-LD, blocking `HelvetyThemeInitScript` in `<head>` (all public shells, including Store navbar-only), theme (`ThemeProvider`), auth/session wiring (`AuthTokenHandler`, `SessionRecovery`), `TooltipProvider`, optional `wrapInsideTooltipProvider` (CSRF and app-specific client providers), navbar slot, main region, [`Footer`](./src/footer.tsx) (essential/auth cookie notice; links to Privacy for storage), and toaster. Layouts pass SSR `initialUser` (and CSRF where needed): `bootstrapPublicLayoutUser()` on `web`, `pdf`, `image-upscaler`, and `image-editor` layouts; `bootstrapE2eeLayoutSession()` on the store root layout; `bootstrapAuthLayoutSession()` on **auth** (same CSRF + user contract as store/E2EE). Store uses `themeProviderScope: "navbar-only"` and `CSRFProvider`; Auth `wrapInsideTooltipProvider` adds `CSRFProvider` and `EncryptionProvider`. Auth and Store use semantic `bg-background` from the shell; the gateway homepage server-renders copy in `HeroMarketingShell` (`private · simple · clean` from `HELVETY_COMPANY_VALUES_TAGLINE`) on the same plain theme background. For `mainVariant: "scroll-area"`, page content scrolls inside the shared **`ScrollArea`** (`@helvety/ui/scroll-area`, Base UI / shadcn); optional **`scrollAreaMainPrefix`** (Store `StoreNav`, solid `CommandBar`) is rendered **above** that scroll region so section nav stays pinned like the navbar. `<body>` always merges **`bg-background text-foreground`** (plus **`font-sans antialiased`**) with optional **`bodyClassName`** so body paint matches the theme after `<head>` init.
- **E2EE** app shell primitives (`E2eeAppRootLayout` with blocking `HelvetyThemeInitScript` in `<head>`, `bootstrapE2eeLayoutSession()`, `CommandBarPageLayout`, encryption gate, CSRF/session wiring) for `tasks`, `contacts`, `notes`, and `links`
- Shared top navigation chrome (`HelvetyShellNavbar`) across public zones. E2EE apps use `E2eeAppNavbar`, which composes `HelvetyShellNavbar` with encryption-aware props.
- Cross-app navigation: **`AppSwitcher`** (inside **`NavbarBrand`**) reads product sections from `@helvety/shared/helvety-ecosystem-sections` via [`app-switcher-sections.tsx`](src/app-switcher-sections.tsx) (Core Apps stay UI-local) and passes **absolute** `urls.*` hrefs into **`next/link`**, so each zone’s Next **`basePath`** (`/auth`, `/store`, …) does not rewrite links to other apps. The switcher sheet uses **`SHEET_SCROLLABLE_SHELL_CLASS`** and scrolls long link lists in **`ScrollArea`**. **`HelvetyShellNavbar`** uses the same scrollable sheet pattern for the mobile menu. The gateway (`apps/web`, no **`basePath`**) may still use **`getLocalAppHref`** from `@helvety/shared/config` for path-shaped same-origin links (for example hero CTAs); see that helper’s JSDoc for when **not** to strip origins.

## Key Exports

**Public zones (`web`, `auth`, `store`, `pdf`, `image-upscaler`, `image-editor`):**

- `@helvety/ui/helvety-public-shell-root-layout` -> `HelvetyPublicShellRootLayout`: Async root layout with JSON-LD (`organization` plus caller-supplied `@graph` tail), blocking `HelvetyThemeInitScript` in `<head>` (all scopes), `ThemeProvider` (full tree or navbar-only), `AuthTokenHandler`, `SessionRecovery`, `TooltipProvider`, optional `wrapInsideTooltipProvider` (Auth: `CSRFProvider` and `EncryptionProvider`; Store: `CSRFProvider`), **`mainVariant`**: `scroll-area` (`ScrollArea` from `@helvety/ui/scroll-area`; optional **`scrollAreaMainPrefix`** pinned outside scroll) or `overflow-main` (tool apps pin command bars as flex siblings above an `overflow-hidden` workspace), plus footer and toaster. `<body>` merges `bg-background text-foreground` with optional `bodyClassName`.
- `@helvety/ui/command-bar` -> `CommandBar`: Shared pinned command bar shell (`shrink-0`; parents place it outside scroll, not CSS `sticky`). **`variant`**: `solid` (default; opaque `bg-surface-toolbar`, E2EE/tool bars and Store section nav) or `translucent` (frosted `bg-surface-toolbar/65` with backdrop blur for optional full-bleed backgrounds; not used on the gateway today). User-facing copy says **command bar** (see [`docs/ui-action-button-contract.md`](../../docs/ui-action-button-contract.md)).
- `@helvety/ui/helvety-shell-route-loading` -> `HelvetyShellRouteLoading`: Full-viewport `bg-background` wrapper around `LoadingSpinner` for root `app/loading.tsx` on **`web`**, **`auth`**, and **`store`** (avoids browser-default flash during client navigations).
- `@helvety/ui/e2ee-shell-route-loading` -> `E2eeShellRouteLoading`: Full-viewport loading with navbar and command-bar skeletons for root `app/loading.tsx` on **E2EE apps** (`tasks`, `contacts`, `notes`, `links`).
- `@helvety/ui/use-html-dark-theme` -> `useHtmlDarkTheme`, `readHtmlDarkTheme`: Subscribes to `html.dark` (`next-themes` class strategy). Used when client code must read the resolved theme from `html`; the gateway hero keeps a plain theme background while the server-rendered headline uses **`text-brand-swiss-red`** on the “Switzerland” span via `--brand-swiss-red` in `globals.css`. This also works outside navbar-only `ThemeProvider` (blocking init runs in `<head>` on all public shells).
- `@helvety/ui/loading-spinner` -> `LoadingSpinner`: Spinner only; root `app/loading.tsx` on **pdf**, **image-upscaler**, and **image-editor** re-export this directly. Nested routes (for example store product pages) may use `LoadingSpinner` as well.
- `@helvety/ui/date-picker` / `@helvety/ui/date-time-picker` -> shared form date controls (promoted from app-local copies; import from here in E2EE editors).
- `@helvety/ui/create-app-navbar` -> `createE2eeAppNavbar`, `createPublicShellNavbar`, `createVaultAwareShellNavbar`, `publicToolNavbarBrand`: thin navbar factories used by zone `components/navbar.tsx` files.
- `@helvety/ui/csrf-provider` -> `CSRFProvider`, `useCSRFToken`, `useSetCSRFToken`, `useCSRFSafe`: layout SSR seeds the token; auth OTP success applies server-rotated tokens via `useSetCSRFToken` before the next mutating action (then `syncLoginUrlStep` updates `?step=` without navigation).
- `@helvety/ui/auth-session-singleflight` -> `getUserSingleflight`, `invalidateAuthUserProbeCache`: coalesces client `auth.getUser()` probes with a short cooldown; auth login calls `invalidateAuthUserProbeCache()` after OTP so bootstrap/passkey steps see the new session without remounting the login shell.

**E2EE zones (`tasks`, `contacts`, `notes`, `links`):**

- `@helvety/ui/e2ee-app-root-layout` -> `E2eeAppRootLayout`: Each app's `app/layout.tsx` passes **`encryptionProvider`** (the zone's client encryption context component, for example from `@/lib/crypto`), **`renderNavbar`**, **`softwareApplication`** (fields for JSON-LD `SoftwareApplication`), **`organizationLogoUrl`**, and **`children`**. Injects blocking **`HelvetyThemeInitScript`** in **`<head>`** (via `@helvety/ui/helvety-theme-init-script`; script body from `@helvety/shared/layout-primitives`). Mounts the same **`Footer`** cookie notice. Main is overflow-hidden; list dashboards and detail-sheet editors pin command bars with **`CommandBarPageLayout`** and scroll body content via **`ScrollArea`**. See [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md).
- `@helvety/ui/command-bar-page-layout` -> `CommandBarPageLayout`: Pins a command bar outside scroll; scrolls page body with the shared shadcn `ScrollArea`. Flex utilities target the viewport via `[&>[data-slot=scroll-area-viewport]]` (see `scroll-area.tsx`).
- `@helvety/ui/sheet-scroll-layout` -> `SHEET_SCROLLABLE_SHELL_CLASS`, `SHEET_SCROLLABLE_BODY_CLASS`: Shared flex/overflow classes for full-height sheets (app switcher, mobile menu, E2EE entity detail shell). Completes the height chain so nested `ScrollArea` or `CommandBarPageLayout` scrolls instead of clipping.
- `@helvety/ui/accessible-sheet-header` -> `AccessibleSheetHeader`: `SheetTitle` plus `sr-only` `SheetDescription` for sheet a11y (used by app switcher, mobile menu, and E2EE entity sheets).
- `@helvety/ui/e2ee-entity-detail-sheet` -> `E2eeEntityDetailSheet`: Wide right-hand sheet shell for E2EE list dashboards (Notes, Tasks, Contacts, Links). Wraps editors in **`SHEET_SCROLLABLE_BODY_CLASS`** so **`CommandBarPageLayout`** receives a bounded viewport. Every `Dialog`/`Sheet` must include a `*Description` (use `AccessibleSheetHeader` or `sr-only` `SheetDescription`/`DialogDescription`).
- `@helvety/ui/use-e2ee-entity-panel` -> `useE2eeEntityPanel`: Sheet open/close state and **save-first** **`openCreate()`** (`formMode: "create"` with no entity id; no URL until save). Panel state only; no URL sync. `openEntity` / `closePanel` no-op when state is unchanged.
- `@helvety/ui/use-e2ee-entity-panel-with-url` -> `useE2eeEntityPanelWithUrl`, `useE2eeEntityUrlSync`: Tasks (`?item=`), Notes (`?note=`), and Contacts (`?contact=`). Writes the active entity id on `openEntity` / clears on close; `openCreate()` does not touch the URL.
- `@helvety/ui/use-sync-e2ee-entity-panel-from-url` -> `useSyncE2eeEntityPanelFromUrl`: **Required** with `useE2eeEntityPanelWithUrl` on tasks/notes/contacts dashboards so back/forward and `?param=` deep links sync the sheet without redundant updates (skips close while `formMode === "create"` or URL intent is `opening` / `closing`). Links uses `useLinksPanelUrlSync` instead (dual `?link=` / `?folder=`).
- `@helvety/ui/use-e2ee-dashboard-selected-entity` -> `useE2eeDashboardSelectedEntity`: Resolves the active sheet entity from the in-memory list, with single-row fetch fallback for deep links.
- `@helvety/ui/e2ee-form-layout` -> `E2EE_ENTITY_SHEET_CONTENT_CLASS` (extends `SHEET_SCROLLABLE_SHELL_CLASS` with wide max-width), `E2EE_UNSAVED_CHANGES_DIALOG`, editor field spacing helpers.
- `@helvety/ui/e2ee-app-navbar` -> `E2eeAppNavbar`, `E2eeAppNavbarLabels`: Composes `HelvetyShellNavbar` for E2EE zones; defaults `loginReturnUrl` to `"current"` so sign-in returns to the open entity.
- `@helvety/ui/hooks/use-encrypted-sortable-items` -> `useEncryptedSortableItems`: Shared encrypted list CRUD/reorder hook with optimistic `update()` (patch before network, rollback on failure). **Save-first create:** call `create(input)` on first save (client UUID + encrypt at save time). Zone hooks merge structural metadata (stage, label, category, priority) via `@helvety/shared/e2ee-structural-payload` (`pickDefinedStructuralFields`). Tasks, notes, and contacts list hooks are thin wrappers. Sheet editors receive `update` / `remove` / `refresh` from the dashboard (Links pattern).
- `@helvety/ui/hooks/use-encrypted-single-item` -> `useEncryptedSingleItem`: Optional single-entity hook for non-dashboard fetch paths; E2EE dashboards should not use it in sheet editors.
- `@helvety/ui/e2ee-item-editor-shell` -> `E2eeRichTextItemEditorShell`, `useE2eeRichTextItemEditorSave`: Shared rich-text editor shell (title, Tiptap body, unsaved-changes dialog). Pass `initialDescription` once per session (stable `editorSessionKey` = record id). `@helvety/ui/tiptap-editor` uses mount-only initial `content`; the shell loads ciphertext via `editorRef.setContent` after mount. Links embed link panels in `LinkEditor` instead.
- `@helvety/ui/entity-links-panel` -> `EntityLinksPanel`: Cross-app link picker/unlink UI (tasks ↔ notes ↔ contacts ↔ links); apps supply hooks, labels, and deep links (`buildE2eeDeepLink` from `@helvety/shared/e2ee-deep-link`). The **Add** search UI is **Popover + Input + ScrollArea** (not a cmdk command palette). Loads catalog data when the section expands or the Add picker opens.
- `@helvety/ui/e2ee-app-link-ui` -> `E2EE_APP_LINK_UI`: Shared section titles and Lucide icons for cross-app link panels (aligned with the app switcher).
- `@helvety/ui/create-e2ee-entity-links-hook` -> `createE2eeEntityLinksHook`: Factory for cross-app link hooks (CSRF, `guardE2eeMasterKey`, catalog/link refresh); all four E2EE vault apps export thin configured hooks.
- `@helvety/ui/item-command-bar` -> `ItemCommandBar`: Shared editor command bar (back/refresh/save/delete); tasks and notes re-export from `@/components/item-command-bar`.
- `@helvety/ui/hooks/use-e2ee-data-export` -> `useE2eeDataExport`: Shared decrypted export hook; E2EE apps pass `masterKey` and a zone `lib/data-export.ts` download function (JSON download plumbing lives in `@helvety/shared/e2ee-json-export`).
- `@helvety/ui/auth-navigation` -> `reportE2eeHookError`, `reportE2eeActionFailure`, `getE2eeHookErrorMessage`: E2EE client hooks should use these instead of hand-rolled `toast.error` + `triggerE2eeHookAuthErrorNavigation`.

**Top bar (all zones that render the shared chrome):**

- `@helvety/ui/helvety-shell-navbar` -> `HelvetyShellNavbar`, `HelvetyShellNavbarEncryption`, `HelvetyShellNavbarAuthSnapshot`: `E2eeAppNavbar` and the Auth app pass `encryption` as a function of the navbar auth snapshot (E2EE: unlock badge tied to `user.id`; Auth: same gating plus app-specific tooltip body via `@helvety/ui/encryption-tooltip-content`). The About dialog appends product copy from `aboutDescription`, then Helvety attribution and Swiss origin (no license paragraph; licensing belongs on legal pages and Store product About sections).

**Other shared primitives:**

- `@helvety/ui/encryption-tooltip-content` -> `EncryptionTooltipContent`: Shared three-block encryption tooltip shell (heading plus caller body plus passkey lockout disclaimer), used by `E2eeAppNavbar` and `apps/auth`.
- `@helvety/ui/app-error` -> `AppError`: Shared `error.tsx` UI. The default title uses **`GENERIC_USER_ERROR`** from `@helvety/shared/user-facing-errors` (same canonical line as server actions), with support text to retry or email support.
- `@helvety/ui/root-global-error` -> `RootGlobalError`: Minimal root-layout error surface with the same title constant and retry/contact pattern as `AppError`.
- `@helvety/ui/use-e2ee-entity-list-dnd-sensors` -> shared dnd sensor setup
- `@helvety/ui/entity-command-bar` -> `EntityCommandBar`: Shared responsive list toolbar pattern for create/refresh/export/settings/edit/delete actions (compose inside `CommandBar`; pair with `CommandBarPageLayout` on E2EE dashboards).
- `@helvety/ui/row-action-button` -> `RowActionButton`: Icon-only list row actions (web: `aria-label`; extension: `showTooltip` via `IconTooltipButton`). See [`docs/ui-action-button-contract.md`](../../docs/ui-action-button-contract.md).
- `@helvety/ui/form-field` -> `FormField`: Label + control with `E2EE_FORM_FIELD_CLASS` spacing; clones `id` onto the child control.
- `@helvety/ui/icon-size` -> `ICON_SIZE_CLASS`: Default Lucide size (`size-4`) for row/toolbar icons.
- `@helvety/ui/public-tool-workspace` -> `PUBLIC_TOOL_*` layout class strings for PDF, image-upscaler, and image-editor sidebars/canvas shells.
- `@helvety/ui/sonner` -> `Toaster`, `toast`: Re-export of Sonner; zone apps import here (do not depend on `sonner` directly).
- `@helvety/ui/editor-command-bar` -> `EditorCommandBar`: Shared save/back/refresh toolbar for entity editors (same pinning contract as `EntityCommandBar`).
- `@helvety/ui/entity-dashboard-shell` -> `EntityDashboardShell`: Shared title, search, and list page shell composition.
- `@helvety/ui/list-states` -> `ListLoadingState`, `ListErrorState`, `ListEmptyState`, `ListEmptySearchState`: Standardized list feedback surfaces.
- `@helvety/ui/native-select` -> `NativeSelect`: Consistent native select styling wrapper for simple select controls.
- `@helvety/ui/textarea` -> `Textarea`: Multi-line text field styled like `Input` (touch-safe 16px on coarse pointer).
- `@helvety/ui/form-control-text-size` -> `FORM_CONTROL_TEXT_SIZE_CLASS`, `FORM_CONTROL_PROSE_SIZE_CLASS`: Shared touch-aware typography for form primitives (internal; apps use the components above).
- `@helvety/ui/form-control-touch.css` -> coarse-pointer `font-size: 1rem` safety net for native form fields and contenteditable surfaces. Imported by `globals.css` (zone apps) and the browser extension shell.

Also includes reusable UI building blocks used across zones (for example `@base-ui/react` primitives via shadcn `base-vega`, `@helvety/ui/calendar` on react-day-picker v10, `@helvety/ui/table` for semantic table primitives, `@helvety/ui/icon-renderer` for kebab-case Lucide names in E2EE configs, **CommandBar** / **EntityCommandBar** toolbar shells — not the removed cmdk **Command** component — plus search fields and selected editor helpers).

## Styling / Tailwind

- **`globals.css`** (`@helvety/ui/globals.css`): semantic design tokens and Tailwind v4 imports for every zone app (`@import` from each app’s `app/globals.css`). Imports **`form-control-touch.css`** so focused form fields stay ≥16px on touch devices (prevents iOS Safari input zoom). Marketing accents include **`--brand-swiss-red`** (`text-brand-swiss-red` on the gateway hero).
- **PostCSS at build time:** zone apps re-export [`@helvety/config/postcss`](../config/postcss.mjs), which loads `@tailwindcss/postcss` from [`@helvety/dev-deps`](../dev-deps/). This package also declares **`tailwindcss`** and **`@tailwindcss/postcss`** in **`dependencies`** so Tailwind packages sit on zone apps’ production dependency graph for Turbopack CSS processing. Do not add those packages to individual app manifests. See [`docs/vercel-monorepo-apps.md`](../../docs/vercel-monorepo-apps.md) and [`docs/app-consistency-checklist.md`](../../docs/app-consistency-checklist.md).

## Testing

Run from repo root:

```bash
bun run test --filter=@helvety/ui
```

Run from `packages/ui`:

```bash
bun run test
bun run test:watch
bun run test:coverage
```

Coverage focuses on stable primitives and key shared UX surfaces (`CommandBar`, `CommandBarPageLayout`, `EntityCommandBar`, `RowActionButton`, `FormField`, `EntityLinksPanel`, `Calendar`, `getLucideIcon` / `renderIcon`, `HelvetyShellNavbar`, `E2eeAppNavbar`, `EncryptionGate`, `EncryptionTooltipContent`, `AccessibleSheetHeader`, `E2eeEntityDetailSheet`, `E2eeRichTextItemEditorShell`, `sheet-scroll-layout`, `HelvetyShellRouteLoading`, `E2eeShellRouteLoading`, `TiptapEditor`, `e2ee-rich-text-editor-invariants`, `useE2eeEntityPanel`, `useE2eeEntityPanelWithUrl`, `useSyncE2eeEntityPanelFromUrl`, `useE2eeDashboardSelectedEntity`, `useEncryptedSortableItems`, `useEncryptedSingleItem`, `useE2eeDataExport`, `createE2eeEntityLinksHook`, `reportE2eeHookError` / `reportE2eeActionFailure`, `e2ee-dashboard-wiring` / `sheet-scroll-wiring` / `helvety-layout-wiring` / `ui-base-ui-wiring` / `ui-docs-copy-wiring` / `ui-actions-wiring` structural guards, `HelvetyPublicShellRootLayout`, and `E2eeAppRootLayout`). **`vitest.setup.ts`** stubs `document.elementFromPoint` for TipTap 3.27+ placeholder viewport tracking under jsdom. **`e2ee-dashboard-wiring.test.ts`** guards the Links pattern (list-hook saves, no dual hooks in sheet editors), save-first create wiring, and `useE2eeDashboardSelectedEntity`. **`icon-renderer.test.tsx`** asserts lucide-react drift alignment. **`e2ee-item-editor-shell.test.tsx`** covers mount-only rich-text loading and unsaved-change guards. Gateway hero and vendor tests live in `apps/web`. Most toolchain versions (`vitest`, testing-library, `jsdom`, etc.) are pinned in [`@helvety/dev-deps`](../dev-deps/) (`bun run deps:drift`, `test:hygiene`); **Tailwind/PostCSS production packages** on this package are covered by [`packages/shared/src/postcss-app-consistency.test.ts`](../shared/src/postcss-app-consistency.test.ts). Drift, security-floor, and `clean:artifacts` scripts are smoke-tested in [`packages/shared/src/deps-guardrail-scripts.test.ts`](../shared/src/deps-guardrail-scripts.test.ts). See the root [`README.md`](../../README.md) › **Testing Consistency**.

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Monorepo naming and formatting: [`docs/naming-conventions.md`](../../docs/naming-conventions.md)
- UI/shadcn integration policy and ownership boundaries: [`docs/ui-shadcn-integration-policy.md`](../../docs/ui-shadcn-integration-policy.md)
- Shared backend package: [`packages/shared/README.md`](../shared/README.md)
