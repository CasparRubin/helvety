# @helvety/ui

Shared React UI components and app-shell primitives for Helvety web apps in this monorepo (helvety.com).

## Scope

This package provides:

- Shared design system and utility components
- Theme and layout helpers
- **Public** app root shell (`HelvetyPublicShellRootLayout`): `web`, `auth`, `store`, `pdf`, and `image-upscaler` share CSP nonce, JSON-LD, theme (`ThemeProvider`), auth/session wiring (`AuthTokenHandler`, `SessionRecovery`), `TooltipProvider`, optional `wrapInsideTooltipProvider` (CSRF and app-specific client providers), navbar slot, main region, footer, toaster, and Vercel analytics. **Store** and **Auth** wrap the shell in `@helvety/light-pillar` `HelvetyShellWithLightPillarBackdrop` (content paints first; Light Pillar WebGL on **md+**, static `bg-background` below **md** or with reduced motion; see `packages/light-pillar/README.md`). Store uses `themeProviderScope: "navbar-only"` and `CSRFProvider`; Auth adds `EncryptionProvider`. For `mainVariant: "scroll-area"`, page content scrolls inside Radix **`ScrollArea`**; optional **`scrollAreaMainPrefix`** (Store `StoreNav`, translucent `CommandBar`) is rendered **above** that scroll region so section nav stays pinned like the navbar. Optional **`shellColumnClassName`**, **`scrollAreaRootClassName`**, **`scrollAreaViewportClassName`**, and **`bodyClassName`** relax default overflow so content can paint past the scroll column (**`apps/web` only**, for the gateway hero’s full-bleed Hyperspeed host). Store and Auth keep default overflow; the pillar paints in a fixed layer behind the shell. **`ScrollArea`** accepts **`viewportClassName`** to override Radix viewport overflow (for example `!overflow-visible`). `<body>` always merges **`bg-background text-foreground`** (plus **`font-sans antialiased`**) with optional **`bodyClassName`** so the initial document paint matches the theme.
- **E2EE** app shell primitives (`E2eeAppRootLayout`, `CommandBarPageLayout`, encryption gate, CSRF/session wiring) for `tasks`, `contacts`, `notes`, and `links`
- Shared top navigation chrome (`HelvetyShellNavbar`) across public zones. E2EE apps use `E2eeAppNavbar`, which composes `HelvetyShellNavbar` with encryption-aware props.
- Cross-app navigation: **`AppSwitcher`** (inside **`NavbarBrand`**) reads link data from [`app-switcher-sections.tsx`](src/app-switcher-sections.tsx) and passes **absolute** `urls.*` hrefs into **`next/link`**, so each zone’s Next **`basePath`** (`/auth`, `/store`, …) does not rewrite links to other apps. The gateway (`apps/web`, no **`basePath`**) may still use **`getLocalAppHref`** from `@helvety/shared/config` for path-shaped same-origin links (for example hero CTAs); see that helper’s JSDoc for when **not** to strip origins.

## Key Exports

**Public zones (`web`, `auth`, `store`, `pdf`, `image-upscaler`):**

- `@helvety/ui/helvety-public-shell-root-layout` -> `HelvetyPublicShellRootLayout`: Async root layout with JSON-LD (`organization` plus caller-supplied `@graph` tail), theme (full tree or navbar-only), `AuthTokenHandler`, `SessionRecovery`, `TooltipProvider`, optional `wrapInsideTooltipProvider` (Auth: CSRF, encryption, and `HelvetyShellWithLightPillarBackdrop`; Store: `CSRFProvider` and the same backdrop), **`mainVariant`**: `scroll-area` (Radix `ScrollArea` from `@helvety/ui/scroll-area`; optional **`scrollAreaMainPrefix`** pinned outside scroll) or `overflow-main` (tool apps pin command bars as flex siblings above an `overflow-hidden` workspace), plus footer, toaster, and analytics. Optional overflow-related props (see **Scope** above) for horizontal bleed on **`apps/web`**. `<body>` merges `bg-background text-foreground` with optional `bodyClassName`.
- `@helvety/ui/command-bar` -> `CommandBar`: Shared pinned toolbar shell (`shrink-0`; parents place it outside scroll, not CSS `sticky`). **`variant`**: `solid` (default; opaque `bg-surface-toolbar`, E2EE/tool bars) or `translucent` (frosted `bg-surface-toolbar/65` with backdrop blur; Store section nav over full-bleed shell backgrounds).
- `@helvety/ui/helvety-shell-route-loading` -> `HelvetyShellRouteLoading`: Full-viewport `bg-background` wrapper around `LoadingSpinner` for root `app/loading.tsx` on **`web`**, **`auth`**, and **`store`** (avoids white flash during client navigations on auth/store shells, including below-md static fallback).
- `@helvety/ui/loading-spinner` -> `LoadingSpinner`: Spinner only; nested segment loaders and tool apps re-export this directly.

**E2EE zones (`tasks`, `contacts`, `notes`, `links`):**

- `@helvety/ui/e2ee-app-root-layout` -> `E2eeAppRootLayout`: Each app's `app/layout.tsx` passes **`encryptionProvider`** (the zone's client encryption context component, for example from `@/lib/crypto`), **`renderNavbar`**, **`softwareApplication`** (fields for JSON-LD `SoftwareApplication`), **`organizationLogoUrl`**, and **`children`**. Main is overflow-hidden; dashboards and sheet-embedded editors use **`CommandBarPageLayout`** to pin command bars and scroll via `ScrollArea`.
- `@helvety/ui/command-bar-page-layout` -> `CommandBarPageLayout`: Pins a command bar outside scroll; scrolls page body with the shared shadcn `ScrollArea`.
- `@helvety/ui/e2ee-entity-detail-sheet` -> `E2eeEntityDetailSheet`: Wide right-hand sheet shell for E2EE list dashboards (Notes, Tasks, Contacts, Links).
- `@helvety/ui/use-e2ee-entity-panel` -> `useE2eeEntityPanel`: Sheet open/close state and persist-on-open **`openNewDraft`** for Notes, Tasks, and Contacts.
- `@helvety/ui/e2ee-form-layout` -> `E2EE_ENTITY_SHEET_CONTENT_CLASS`, `E2EE_UNSAVED_CHANGES_DIALOG`, editor field spacing helpers.
- `@helvety/ui/e2ee-app-navbar` -> `E2eeAppNavbar`, `E2eeAppNavbarLabels`

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

Also includes reusable UI building blocks used across zones (for example command bars, search fields, and selected editor helpers).

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

Coverage focuses on stable primitives and key shared UX surfaces (`CommandBar`, `CommandBarPageLayout`, `HelvetyShellNavbar`, `E2eeAppNavbar`, `EncryptionTooltipContent`, `HelvetyPublicShellRootLayout`, and `E2eeAppRootLayout`). Shell backdrop behavior is tested in `@helvety/light-pillar`. Vitest and related devDependency specifiers are normalized across workspaces from the repo root (`bun run deps:drift`, `bun run test:hygiene`); see the root [`README.md`](../../README.md) › **Testing Consistency**.

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Monorepo naming and formatting: [`docs/naming-conventions.md`](../../docs/naming-conventions.md)
- UI/shadcn integration policy and ownership boundaries: [`docs/ui-shadcn-integration-policy.md`](../../docs/ui-shadcn-integration-policy.md)
- Shared backend package: [`packages/shared/README.md`](../shared/README.md)
