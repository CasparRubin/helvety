# @helvety/ui

Shared React UI components and app-shell primitives for Helvety web apps in this monorepo (helvety.com).

## Scope

This package provides:

- Shared design system and utility components
- Theme and layout helpers
- **Public** app root shell (`HelvetyPublicShellRootLayout`): `web`, `auth`, `store`, `pdf`, and `image-upscaler` share CSP nonce, JSON-LD, theme (`ThemeProvider`), auth/session wiring (`AuthTokenHandler`, `SessionRecovery`), `TooltipProvider`, optional `wrapInsideTooltipProvider` (CSRF and app-specific client providers), navbar slot, main region, footer, toaster, and Vercel analytics. Store uses a navbar-only `ThemeProvider` scope via `themeProviderScope: "navbar-only"`. For `mainVariant: "scroll-area"`, optional **`shellColumnClassName`**, **`scrollAreaRootClassName`**, **`scrollAreaViewportClassName`**, and **`bodyClassName`** relax default overflow so content can paint past the scroll column (used on `apps/web` for the gateway hero’s full-bleed WebGL backdrop: stable SSR host, canvas client-only). **`ScrollArea`** accepts **`viewportClassName`** to override Radix viewport overflow (for example `!overflow-visible`). `<body>` always merges **`bg-background text-foreground`** (plus **`font-sans antialiased`**) with optional **`bodyClassName`** so the initial document paint matches the theme.
- **E2EE** app shell primitives (`E2eeAppRootLayout`, encryption gate, CSRF/session wiring) for `tasks`, `contacts`, and `notes`
- Shared top navigation chrome (`HelvetyShellNavbar`) across public zones. E2EE apps use `E2eeAppNavbar`, which composes `HelvetyShellNavbar` with encryption-aware props.
- Cross-app navigation primitives (for example `AppSwitcher` inside `NavbarBrand`)

## Key Exports

**Public zones (`web`, `auth`, `store`, `pdf`, `image-upscaler`):**

- `@helvety/ui/helvety-public-shell-root-layout` -> `HelvetyPublicShellRootLayout`: Async root layout with JSON-LD (`organization` plus caller-supplied `@graph` tail), theme (full tree or navbar-only), `AuthTokenHandler`, `SessionRecovery`, `TooltipProvider`, optional `wrapInsideTooltipProvider` (Auth: CSRF plus encryption, Store: `CSRFProvider`), **`mainVariant`** — `scroll-area` (Radix `ScrollArea` from `@helvety/ui/scroll-area`) or `overflow-main` — footer, toaster, and analytics. Optional overflow-related props (see **Scope** above) for horizontal bleed. `<body>` merges `bg-background text-foreground` with optional `bodyClassName`.

**E2EE zones (`tasks`, `contacts`, `notes`):**

- `@helvety/ui/e2ee-app-root-layout` -> `E2eeAppRootLayout`: Each app's `app/layout.tsx` passes **`encryptionProvider`** (the zone's client encryption context component, for example from `@/lib/crypto`), **`renderNavbar`**, **`softwareApplication`** (fields for JSON-LD `SoftwareApplication`), **`organizationLogoUrl`**, and **`children`**.
- `@helvety/ui/e2ee-app-navbar` -> `E2eeAppNavbar`, `E2eeAppNavbarLabels`

**Top bar (all zones that render the shared chrome):**

- `@helvety/ui/helvety-shell-navbar` -> `HelvetyShellNavbar`, `HelvetyShellNavbarEncryption`, `HelvetyShellNavbarAuthSnapshot`: `E2eeAppNavbar` and the Auth app pass `encryption` as a function of the navbar auth snapshot (E2EE: unlock badge tied to `user.id`; Auth: same gating plus app-specific tooltip body via `@helvety/ui/encryption-tooltip-content`).

**Other shared primitives:**

- `@helvety/ui/encryption-tooltip-content` -> `EncryptionTooltipContent`: Shared three-block encryption tooltip shell (heading plus caller body plus passkey lockout disclaimer), used by `E2eeAppNavbar` and `apps/auth`.
- `@helvety/ui/app-error` -> `AppError`: Shared `error.tsx` UI. The default title uses **`GENERIC_USER_ERROR`** from `@helvety/shared/user-facing-errors` (same canonical line as server actions), with support text to retry or email support.
- `@helvety/ui/root-global-error` -> `RootGlobalError`: Minimal root-layout error surface with the same title constant and retry/contact pattern as `AppError`.
- `@helvety/ui/use-e2ee-entity-list-dnd-sensors` -> shared dnd sensor setup
- `@helvety/ui/entity-command-bar` -> `EntityCommandBar`: Shared responsive list toolbar pattern for create/refresh/export/settings/edit/delete actions.
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

Coverage focuses on stable primitives and key shared UX surfaces (`HelvetyShellNavbar`, `E2eeAppNavbar`, `EncryptionTooltipContent`, and `HelvetyPublicShellRootLayout`). Vitest and related devDependency specifiers are normalized across workspaces from the repo root (`bun run deps:drift`, `bun run test:hygiene`); see the root [`README.md`](../../README.md) › **Testing Consistency**.

## Related

- Root monorepo docs: [`README.md`](../../README.md)
- Monorepo naming and formatting: [`docs/naming-conventions.md`](../../docs/naming-conventions.md)
- UI/shadcn integration policy and ownership boundaries: [`docs/ui-shadcn-integration-policy.md`](../../docs/ui-shadcn-integration-policy.md)
- Shared backend package: [`packages/shared/README.md`](../shared/README.md)
