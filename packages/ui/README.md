# @helvety/ui

Shared React UI components and app-shell primitives for Helvety web apps in this monorepo (helvety.com).

## Scope

This package provides:

- Shared design system and utility components
- Theme and layout helpers
- **Public** app root shell (`HelvetyPublicShellRootLayout`): `web`, `auth`, `store`, `pdf`, `docs`, and `image-upscaler` share CSP nonce, JSON-LD, blocking `HelvetyThemeInitScript` in `<head>` (all public shells, including Store navbar-only), theme (`ThemeProvider`), auth/session wiring (`AuthTokenHandler`, `SessionRecovery`), `TooltipProvider`, optional `wrapInsideTooltipProvider` (CSRF and app-specific client providers), navbar slot, main region, [`Footer`](./src/footer.tsx) (essential/auth cookie notice; links to Privacy for storage), and toaster. Layouts pass SSR `initialUser` (and CSRF where needed): `bootstrapPublicLayoutUser()` on `web`, `pdf`, and `image-upscaler` layouts; `bootstrapE2eeLayoutSession()` on store and **docs** root layouts; `bootstrapAuthLayoutSession()` on **auth** (same CSRF + user contract as store/E2EE). Docs `app/page.tsx` reads `getCachedUser()` from `@helvety/shared/cached-server` (deduped with the layout bootstrap) for the vault sheet. Docs uses `mainVariant: "overflow-main"`, mounts `EncryptionGateApp` only in the **My documents** vault sheet (not the full editor), and themes Eigenpal via `apps/docs/styles/`. Store uses `themeProviderScope: "navbar-only"` and `CSRFProvider`; Auth `wrapInsideTooltipProvider` adds `CSRFProvider` and `EncryptionProvider`. Auth and Store use semantic `bg-background` from the shell; the gateway homepage server-renders copy in `HeroMarketingShell` and mounts Hyperspeed WebGL in a client layer only. For `mainVariant: "scroll-area"`, page content scrolls inside Radix **`ScrollArea`**; optional **`scrollAreaMainPrefix`** (Store `StoreNav`, solid `CommandBar`) is rendered **above** that scroll region so section nav stays pinned like the navbar. Optional **`shellColumnClassName`**, **`scrollAreaRootClassName`**, **`scrollAreaViewportClassName`**, and **`bodyClassName`** relax default overflow so content can paint past the scroll column (**`apps/web` only**, for the gateway hero’s full-bleed Hyperspeed host). **`ScrollArea`** accepts **`viewportClassName`** to override Radix viewport overflow (for example `!overflow-visible`). `<body>` always merges **`bg-background text-foreground`** (plus **`font-sans antialiased`**) with optional **`bodyClassName`** so body paint matches the theme after `<head>` init.
- **E2EE** app shell primitives (`E2eeAppRootLayout` with blocking `HelvetyThemeInitScript` in `<head>`, `bootstrapE2eeLayoutSession()`, `CommandBarPageLayout`, encryption gate, CSRF/session wiring) for `tasks`, `contacts`, `notes`, and `links`
- Shared top navigation chrome (`HelvetyShellNavbar`) across public zones. E2EE apps use `E2eeAppNavbar`, which composes `HelvetyShellNavbar` with encryption-aware props.
- Cross-app navigation: **`AppSwitcher`** (inside **`NavbarBrand`**) reads link data from [`app-switcher-sections.tsx`](src/app-switcher-sections.tsx) and passes **absolute** `urls.*` hrefs into **`next/link`**, so each zone’s Next **`basePath`** (`/auth`, `/store`, …) does not rewrite links to other apps. The gateway (`apps/web`, no **`basePath`**) may still use **`getLocalAppHref`** from `@helvety/shared/config` for path-shaped same-origin links (for example hero CTAs); see that helper’s JSDoc for when **not** to strip origins.

## Key Exports

**Public zones (`web`, `auth`, `store`, `pdf`, `docs`, `image-upscaler`):**

- `@helvety/ui/helvety-public-shell-root-layout` -> `HelvetyPublicShellRootLayout`: Async root layout with JSON-LD (`organization` plus caller-supplied `@graph` tail), blocking `HelvetyThemeInitScript` in `<head>` (all scopes), `ThemeProvider` (full tree or navbar-only), `AuthTokenHandler`, `SessionRecovery`, `TooltipProvider`, optional `wrapInsideTooltipProvider` (Auth: `CSRFProvider` and `EncryptionProvider`; Store: `CSRFProvider`), **`mainVariant`**: `scroll-area` (Radix `ScrollArea` from `@helvety/ui/scroll-area`; optional **`scrollAreaMainPrefix`** pinned outside scroll) or `overflow-main` (tool apps pin command bars as flex siblings above an `overflow-hidden` workspace), plus footer and toaster. Optional overflow-related props (see **Scope** above) for horizontal bleed on **`apps/web`**. `<body>` merges `bg-background text-foreground` with optional `bodyClassName`.
- `@helvety/ui/command-bar` -> `CommandBar`: Shared pinned toolbar shell (`shrink-0`; parents place it outside scroll, not CSS `sticky`). **`variant`**: `solid` (default; opaque `bg-surface-toolbar`, E2EE/tool bars and Store section nav) or `translucent` (frosted `bg-surface-toolbar/65` with backdrop blur for optional full-bleed backgrounds; not used on the gateway today).
- `@helvety/ui/helvety-shell-route-loading` -> `HelvetyShellRouteLoading`: Full-viewport `bg-background` wrapper around `LoadingSpinner` for root `app/loading.tsx` on **`web`**, **`auth`**, and **`store`** (avoids browser-default flash during client navigations).
- `@helvety/ui/e2ee-shell-route-loading` -> `E2eeShellRouteLoading`: Full-viewport loading with navbar and command-bar skeletons for root `app/loading.tsx` on **E2EE apps** (`tasks`, `contacts`, `notes`, `links`).
- `@helvety/ui/use-html-dark-theme` -> `useHtmlDarkTheme`, `readHtmlDarkTheme`: Subscribes to `html.dark` (`next-themes` class strategy). Used on the gateway for Hyperspeed and hero text (including **`text-brand-swiss-red`** on the static “Switzerland” span via `--brand-swiss-red` in `globals.css`); also works outside navbar-only `ThemeProvider` when client code must read the resolved theme from `html` (blocking init runs in `<head>` on all public shells).
- `@helvety/ui/loading-spinner` -> `LoadingSpinner`: Spinner only; root `app/loading.tsx` on **docs**, **pdf**, and **image-upscaler** re-export this directly. Nested routes (for example store product pages) may use `LoadingSpinner` as well.
- `@helvety/ui/date-picker` / `@helvety/ui/date-time-picker` -> shared form date controls (promoted from app-local copies; import from here in E2EE editors).
- `@helvety/ui/create-app-navbar` -> `createE2eeAppNavbar`, `createPublicShellNavbar`, `createVaultAwareShellNavbar`, `publicToolNavbarBrand`: thin navbar factories used by zone `components/navbar.tsx` files.
- `@helvety/ui/csrf-provider` -> `CSRFProvider`, `useCSRFToken`, `useSetCSRFToken`, `useCSRFSafe`: layout SSR seeds the token; auth OTP success applies server-rotated tokens via `useSetCSRFToken` before the next mutating action.
- `@helvety/ui/auth-session-singleflight` -> `getUserSingleflight`, `invalidateAuthUserProbeCache`: coalesces client `auth.getUser()` probes with a short cooldown; auth login calls `invalidateAuthUserProbeCache()` after OTP so bootstrap/passkey steps see the new session.

**E2EE zones (`tasks`, `contacts`, `notes`, `links`):**

- `@helvety/ui/e2ee-app-root-layout` -> `E2eeAppRootLayout`: Each app's `app/layout.tsx` passes **`encryptionProvider`** (the zone's client encryption context component, for example from `@/lib/crypto`), **`renderNavbar`**, **`softwareApplication`** (fields for JSON-LD `SoftwareApplication`), **`organizationLogoUrl`**, and **`children`**. Injects blocking **`HelvetyThemeInitScript`** in **`<head>`** (via `@helvety/ui/helvety-theme-init-script`; script body from `@helvety/shared/layout-primitives`). Mounts the same **`Footer`** cookie notice. Main is overflow-hidden; dashboards and sheet-embedded editors use **`CommandBarPageLayout`** to pin command bars and scroll via `ScrollArea`. See [`docs/cookies-telemetry-and-footer.md`](../../docs/cookies-telemetry-and-footer.md).
- `@helvety/ui/command-bar-page-layout` -> `CommandBarPageLayout`: Pins a command bar outside scroll; scrolls page body with the shared shadcn `ScrollArea`.
- `@helvety/ui/accessible-sheet-header` -> `AccessibleSheetHeader`: `SheetTitle` plus `sr-only` `SheetDescription` for Radix sheet a11y (used by app switcher, mobile menu, and E2EE entity sheets).
- `@helvety/ui/e2ee-entity-detail-sheet` -> `E2eeEntityDetailSheet`: Wide right-hand sheet shell for E2EE list dashboards (Notes, Tasks, Contacts, Links). Every `Dialog`/`Sheet` must include a `*Description` (use `AccessibleSheetHeader` or `sr-only` `SheetDescription`/`DialogDescription`).
- `@helvety/ui/use-e2ee-entity-panel` -> `useE2eeEntityPanel`: Sheet open/close state and persist-on-open **`openNewDraft`** (panel state only; no URL sync). `openEntity` / `closePanel` no-op when state is unchanged.
- `@helvety/ui/use-e2ee-entity-panel-with-url` -> `useE2eeEntityPanelWithUrl`, `useE2eeEntityUrlSync`: Tasks (`?item=`), Notes (`?note=`), and Contacts (`?contact=`). Writes the active entity id on open/close.
- `@helvety/ui/use-sync-e2ee-entity-panel-from-url` -> `useSyncE2eeEntityPanelFromUrl`: **Required** with `useE2eeEntityPanelWithUrl` on tasks/notes/contacts dashboards so back/forward and `?param=` deep links sync the sheet without redundant updates (guards against React max-update-depth loops). Links uses `useLinksPanelUrlSync` instead (dual `?link=` / `?folder=`).
- `@helvety/ui/e2ee-form-layout` -> `E2EE_ENTITY_SHEET_CONTENT_CLASS`, `E2EE_UNSAVED_CHANGES_DIALOG`, editor field spacing helpers.
- `@helvety/ui/e2ee-app-navbar` -> `E2eeAppNavbar`, `E2eeAppNavbarLabels`: Composes `HelvetyShellNavbar` for E2EE zones; defaults `loginReturnUrl` to `"current"` so sign-in returns to the open entity.
- `@helvety/ui/hooks/use-encrypted-sortable-items` -> `useEncryptedSortableItems`: Shared encrypted list CRUD/reorder hook; tasks, notes, and contacts list hooks are thin wrappers that inject crypto and server actions.
- `@helvety/ui/hooks/use-encrypted-single-item` -> `useEncryptedSingleItem`: Shared single-entity fetch/decrypt/update/delete hook; tasks, notes, and contacts detail hooks are thin config wrappers.
- `@helvety/ui/e2ee-item-editor-shell` -> `E2eeRichTextItemEditorShell`, `useE2eeRichTextItemEditorSave`: Shared rich-text editor shell (title, Tiptap body, unsaved-changes dialog). Tasks, notes, and contacts editors compose this shell with app-specific metadata and link panels. Stored rich text must be Tiptap JSON (`tiptap-utils` rejects non-JSON/plain-text blobs). Content is sanitized on paste and when loading stored JSON (`tiptap-paste-sanitize.ts`: DOMPurify for HTML, `sanitizeRichTextJson` strips unsafe link `href`s); the toolbar and `Link.validate` also block unsafe URL schemes.
- `@helvety/ui/entity-links-panel` -> `EntityLinksPanel`: Cross-app link picker/unlink UI; apps supply hooks, labels, and deep links (`buildE2eeDeepLink` from `@helvety/shared/e2ee-deep-link`).
- `@helvety/ui/create-e2ee-entity-links-hook` -> `createE2eeEntityLinksHook`: Factory for cross-app link hooks (CSRF, `guardE2eeMasterKey`, catalog/link refresh); tasks, notes, and contacts export thin configured hooks.
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
- `@helvety/ui/editor-command-bar` -> `EditorCommandBar`: Shared save/back/refresh toolbar for entity editors (same pinning contract as `EntityCommandBar`).
- `@helvety/ui/entity-dashboard-shell` -> `EntityDashboardShell`: Shared title, search, and list page shell composition.
- `@helvety/ui/list-states` -> `ListLoadingState`, `ListErrorState`, `ListEmptyState`, `ListEmptySearchState`: Standardized list feedback surfaces.
- `@helvety/ui/native-select` -> `NativeSelect`: Consistent native select styling wrapper for simple select controls.

Also includes reusable UI building blocks used across zones (for example `@helvety/ui/calendar` on react-day-picker v10, `@helvety/ui/icon-renderer` for kebab-case Lucide names in E2EE configs, command bars, search fields, and selected editor helpers).

## Styling / Tailwind

- **`globals.css`** (`@helvety/ui/globals.css`): semantic design tokens and Tailwind v4 imports for every zone app (`@import` from each app’s `app/globals.css`). Marketing accents include **`--brand-swiss-red`** (`text-brand-swiss-red` on the gateway hero).
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

Coverage focuses on stable primitives and key shared UX surfaces (`CommandBar`, `CommandBarPageLayout`, `EntityCommandBar`, `Calendar`, `getLucideIcon` / `renderIcon`, `HelvetyShellNavbar`, `E2eeAppNavbar`, `EncryptionGate`, `EncryptionTooltipContent`, `AccessibleSheetHeader`, `E2eeEntityDetailSheet`, `HelvetyShellRouteLoading`, `E2eeShellRouteLoading`, `TiptapEditor`, `useE2eeEntityPanel`, `useE2eeEntityPanelWithUrl`, `useSyncE2eeEntityPanelFromUrl`, `useEncryptedSortableItems`, `useEncryptedSingleItem`, `useE2eeDataExport`, `createE2eeEntityLinksHook`, `reportE2eeHookError` / `reportE2eeActionFailure`, `e2ee-dashboard-wiring` / `helvety-layout-wiring` structural guards, `HelvetyPublicShellRootLayout`, and `E2eeAppRootLayout`). **`vitest.setup.ts`** stubs `document.elementFromPoint` for TipTap 3.26+ placeholder viewport tracking under jsdom. WebGL hero utilities are tested in `@helvety/light-pillar`; gateway Hyperspeed/vendor tests live in `apps/web`. Most toolchain versions (`vitest`, testing-library, `jsdom`, etc.) are pinned in [`@helvety/dev-deps`](../dev-deps/) (`bun run deps:drift`, `test:hygiene`); **Tailwind/PostCSS production packages** on this package are covered by [`packages/shared/src/postcss-app-consistency.test.ts`](../shared/src/postcss-app-consistency.test.ts). Drift and security-floor scripts are smoke-tested in [`packages/shared/src/deps-guardrail-scripts.test.ts`](../shared/src/deps-guardrail-scripts.test.ts). See the root [`README.md`](../../README.md) › **Testing Consistency**.

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Monorepo naming and formatting: [`docs/naming-conventions.md`](../../docs/naming-conventions.md)
- UI/shadcn integration policy and ownership boundaries: [`docs/ui-shadcn-integration-policy.md`](../../docs/ui-shadcn-integration-policy.md)
- Shared backend package: [`packages/shared/README.md`](../shared/README.md)
