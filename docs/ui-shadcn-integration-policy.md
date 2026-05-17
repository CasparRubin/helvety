# UI / shadcn Integration Policy

This policy defines where UI primitives live and how apps should consume them.

## Source Of Truth

- Shared primitives and cross-app compositions live in `packages/ui/src`.
- App code should import shared primitives from `@helvety/ui/*`.
- **New shadcn CLI adds** should target `packages/ui/components.json` first, then re-export from `@helvety/ui/*`. App `components.json` files stay aligned for local aliases; `consistency:guardrails` enforces `rsc: true`, `tsx: true`, and a `registries` object on every app UI surface.
- App-local `@/components/ui/*` is reserved for feature-specific wrappers that are not reusable across multiple apps.

## Allowed App-Local UI Wrappers

Only the following app-local wrappers are currently allowed:

- `apps/contacts/components/ui/date-picker.tsx`
- `apps/tasks/components/ui/date-time-picker.tsx`

Reason: both are app-specific UX wrappers around shared primitives (`@helvety/ui/calendar`, `@helvety/ui/popover`, `@helvety/ui/input`) and are intentionally tuned to domain workflows.

If a wrapper becomes shared across apps, migrate it into `packages/ui/src` and expose it via `@helvety/ui/*`.
If a new app-local wrapper is needed, add it deliberately with a short rationale and update this policy in the same PR.

## Calendar and icon primitives

- **`@helvety/ui/calendar`** wraps **react-day-picker v10** (shadcn-style `classNames`, including `month_grid`). App date pickers (`contacts` `date-picker`, `tasks` `date-time-picker`) compose this export; do not pin day-picker v9 APIs or class keys.
- **Kebab-case icon names** in E2EE seed data (categories, stages, labels) resolve through **`@helvety/ui/icon-renderer`** (`getLucideIcon`, `renderIcon`). **lucide-react v1** removed brand icons; keep user data on supported names and add **aliases** in `packages/ui/src/icon-renderer.tsx` when legacy stored names must keep working (for example `pocket` → `BookmarkIcon`).

## Styling And Composition Rules

- Prefer semantic variants/tokens (`primary`, `secondary`, `destructive`, `muted`) over hardcoded palette classes.
- Prefer reusable state primitives for list surfaces (`ListLoadingState`, `ListErrorState`, `ListEmptyState`, `ListEmptySearchState`).
- Use shared dashboard primitives (`EntityDashboardShell`) and command bars (`EntityCommandBar`) for list-centric entity apps.
- Pin command bars **outside** scroll: E2EE list/editor pages wrap toolbar + body in `CommandBarPageLayout` (scrolls via `@helvety/ui/scroll-area`); Store uses `scrollAreaMainPrefix` on `HelvetyPublicShellRootLayout` with `CommandBar` `variant="solid"` on `StoreNav` (opaque section nav over the auth/store shell backdrop); Store and Auth share `HelvetyShellWithLightPillarBackdrop` from `@helvety/light-pillar` (WebGL on md+ light or dark; static `bg-background` below md or with reduced motion); PDF/image-upscaler pin `CommandBar` (`variant="solid"`) as a flex sibling above an `overflow-hidden` workspace. Do not rely on CSS `sticky` on `CommandBar` for page-level pinning.
- Use `NativeSelect` from `@helvety/ui/native-select` for consistent native select styling when the full custom select is not required.

## Enforcement

- `scripts/check-consistency-guardrails.mjs` enforces:
  - `components.json` parity across every `apps/*` package that ships a UI surface.
  - import-policy violations for app-local `@/components/ui/*` usage outside the allowlist.
