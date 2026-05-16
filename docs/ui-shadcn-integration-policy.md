# UI / shadcn Integration Policy

This policy defines where UI primitives live and how apps should consume them.

## Source Of Truth

- Shared primitives and cross-app compositions live in `packages/ui/src`.
- App code should import shared primitives from `@helvety/ui/*`.
- App-local `@/components/ui/*` is reserved for feature-specific wrappers that are not reusable across multiple apps.

## Allowed App-Local UI Wrappers

Only the following app-local wrappers are currently allowed:

- `apps/contacts/components/ui/date-picker.tsx`
- `apps/tasks/components/ui/date-time-picker.tsx`

Reason: both are app-specific UX wrappers around shared primitives (`@helvety/ui/calendar`, `@helvety/ui/popover`, `@helvety/ui/input`) and are intentionally tuned to domain workflows.

If a wrapper becomes shared across apps, migrate it into `packages/ui/src` and expose it via `@helvety/ui/*`.
If a new app-local wrapper is needed, add it deliberately with a short rationale and update this policy in the same PR.

## Styling And Composition Rules

- Prefer semantic variants/tokens (`primary`, `secondary`, `destructive`, `muted`) over hardcoded palette classes.
- Prefer reusable state primitives for list surfaces (`ListLoadingState`, `ListErrorState`, `ListEmptyState`, `ListEmptySearchState`).
- Use shared dashboard primitives (`EntityDashboardShell`) and command bars (`EntityCommandBar`) for list-centric entity apps.
- Pin command bars **outside** scroll: E2EE list/editor pages wrap toolbar + body in `CommandBarPageLayout` (scrolls via `@helvety/ui/scroll-area`); Store uses `scrollAreaMainPrefix` on `HelvetyPublicShellRootLayout` with `CommandBar` `variant="translucent"` on `StoreNav` (frosted section nav over the auth/store shell backdrop); Store and Auth share `HelvetyShellWithLightPillarBackdrop` from `@helvety/light-pillar` (WebGL on md+); PDF/image-upscaler pin `CommandBar` (`variant="solid"`) as a flex sibling above an `overflow-hidden` workspace. Do not rely on CSS `sticky` on `CommandBar` for page-level pinning.
- Use `NativeSelect` from `@helvety/ui/native-select` for consistent native select styling when the full custom select is not required.

## Enforcement

- `scripts/check-consistency-guardrails.mjs` enforces:
  - `components.json` parity across every `apps/*` package that ships a UI surface.
  - import-policy violations for app-local `@/components/ui/*` usage outside the allowlist.
