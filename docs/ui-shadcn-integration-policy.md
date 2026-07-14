# UI / shadcn Integration Policy

This policy defines where UI primitives live and how apps should consume them.

## Source Of Truth

- Shared primitives and cross-app compositions live in `packages/ui/src`.
- App code should import shared primitives from `@helvety/ui/*`.
- **shadcn style:** `base-vega` in every `components.json` (canonical: `packages/ui/components.json`). Primitives use **Base UI** (`@base-ui/react`), not Radix.
- **Composition API:** Base UI shadcn uses **`render`** (and `nativeButton={false}` on link triggers) instead of Radix **`asChild`**. Do not add `asChild` in `packages/ui`, zone apps, or the extension popup — `consistency:guardrails` fails on it.
- **Entity link picker:** `@helvety/ui/entity-links-panel` uses **Popover + Input + ScrollArea** for the Add search list. Do **not** reintroduce the cmdk **Command** primitive or `@helvety/ui/command` — that export was removed. This is unrelated to **`CommandBar`** / **`EntityCommandBar`** (pinned command bar shells).
- **New shadcn CLI adds** should target `packages/ui/components.json` first, then re-export from `@helvety/ui/*`. App `components.json` files keep shadcn aliases (for example `"ui": "@/components/ui"`) for CLI compatibility only; **do not** create `apps/*/components/ui/` directories or import `@/components/ui/*` from app code. `consistency:guardrails` enforces `rsc: true`, `tsx: true`, and a `registries` object on every app UI surface.
- Shared date pickers live in `@helvety/ui/date-picker` and `@helvety/ui/date-time-picker` (not under any app).

## App-local UI (disallowed)

Do not add `apps/*/components/ui/*` primitives or feature wrappers under `@/components/ui`. Import shared primitives from `@helvety/ui/*` only. `consistency:guardrails` fails on any `@/components/ui/*` or `../ui/*` import under `apps/*/components/`.

## Gateway React Bits vendor folder (`apps/web`)

- Third-party React Bits text sources (**Shuffle**, **ShinyText**) live in `apps/web/components/vendor/`, not the shared `packages/ui` package.
- Gateway hero: production `/` uses server-rendered copy in `hero-marketing-shell.tsx` (eyebrow at `text-base`, headline, company-values tagline as simple middle-dot text `private · simple · clean` from `HELVETY_COMPANY_VALUES_TAGLINE` in `@helvety/shared/licensing` via `hero-company-values-copy.ts`, Store CTA deep-linked to `urls.storeProducts`) on a plain `bg-background`. `hero-text.tsx` holds Shuffle/ShinyText presets for vendor refresh and tests only; it is not wired into the production shell. Public shells inject blocking theme init in `<head>` (not after `SkipToContent`), so the gateway hero background resolves directly to black or white with the active theme.
- **Legal tables (`apps/web`):** Privacy §5/§9 tables compose `@helvety/ui/table` inside `LegalTableWrap` / `LegalTable` (`apps/web/components/legal-document.tsx`, styles in `apps/web/app/legal.css`). Use `layout="scroll"` for wide tabular data or `layout="cards"` with `data-label` on cells for mobile-friendly disclosure tables; do not add raw `<table className="w-full">` blocks to legal pages.
- After `shadcn add @react-bits/...` from `apps/web`, reconcile Helvety tweaks and keep motion files under `components/vendor/` with imports updated in `hero-text.tsx`.
- Prefer the `**/components/vendor/**` ESLint override in `@helvety/config` over file-level `eslint-disable` in vendored files.

## Calendar and icon primitives

- **`@helvety/ui/calendar`** wraps **react-day-picker v10** (shadcn-style `classNames`, including `month_grid`). Use `@helvety/ui/date-picker` / `@helvety/ui/date-time-picker` for forms; do not pin day-picker v9 APIs or class keys.
- **Kebab-case icon names** in E2EE seed data (categories, stages, labels) resolve through **`@helvety/ui/icon-renderer`** (`getLucideIcon`, `renderIcon`). Use supported **lucide-react v1** names only; unknown names fall back to `circle`.

## Styling And Composition Rules

- **Tailwind / PostCSS:** zone apps import `@helvety/ui/globals.css` and re-export `@helvety/config/postcss` (plugin loaded from `@helvety/dev-deps`). Production `tailwindcss`, `@tailwindcss/postcss`, and **`shadcn`** (for `@import "shadcn/tailwind.css"` in `globals.css`) on `@helvety/ui` keep Tailwind on zone apps’ production dependency graph for Turbopack; the extension popup resolves the same import via Vite alias in `vite.config.ts`. See [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md).
- Prefer semantic variants/tokens (`primary`, `secondary`, `destructive`, `muted`) over hardcoded palette classes. Gateway marketing accents use `--brand-swiss-red` / `text-brand-swiss-red` from `packages/ui/globals.css` (not raw `#FF0000` in components).
- Prefer reusable state primitives for list surfaces (`ListLoadingState`, `ListErrorState`, `ListEmptyState`, `ListEmptySearchState`).
- Use shared dashboard primitives (`EntityDashboardShell`) and command bars (`EntityCommandBar`) for list-centric entity apps.
- Pin command bars **outside** scroll: E2EE list/editor pages wrap command bar + body in `CommandBarPageLayout` (scrolls via `@helvety/ui/scroll-area`); Store uses `scrollAreaMainPrefix` on `HelvetyPublicShellRootLayout` with `CommandBar` `variant="solid"` on `StoreNav` (opaque section nav); PDF, image-upscaler, image-editor, and OCR pin `CommandBar` (`variant="solid"`) as a flex sibling above an `overflow-hidden` workspace (`mainVariant: "overflow-main"` on the public shell). Image-editor adds a second translucent `ImageEditorToolPropertiesBar` below the main bar (color pickers, `@helvety/ui/slider` controls, and number inputs for stroke, blur, dim, corner radius, and font size). Do not rely on CSS `sticky` on `CommandBar` for page-level pinning.
- **Scrollable sheets:** full-height slide-outs use `@helvety/ui/sheet-scroll-layout` (`SHEET_SCROLLABLE_SHELL_CLASS` on `SheetContent`, optional `SHEET_SCROLLABLE_BODY_CLASS` wrapper below a pinned header). List-style sheets (`AppSwitcher`, mobile nav menu) put `ScrollArea` with `min-h-0 flex-1` directly under the header. E2EE entity detail sheets use `E2eeEntityDetailSheet` (body wrapper + `CommandBarPageLayout` in zone editors). Do not scroll the sheet root with raw `overflow-y-auto`; keep the flex height chain intact (`min-h-0`, `flex-1`, `overflow-hidden` on each flex child). Guarded by `sheet-scroll-wiring.test.ts` and `e2ee-dashboard-wiring.test.ts`.
- Use `NativeSelect` from `@helvety/ui/native-select` for consistent native select styling when the full custom select is not required.
- **Action buttons:** follow [`ui-action-button-contract.md`](./ui-action-button-contract.md) for icon, label, placement, and responsive rules. Use `@helvety/ui/row-action-button` for list row icon actions. Import `toast` from `@helvety/ui/sonner` in zone apps (not direct `sonner`). `bun run consistency:ui-actions` (in `ci:check`) guards adoption.

## Mobile form controls (iOS input zoom)

iOS Safari zooms the page when a focused text field is below **16px**. Helvety uses **one shared system** in `@helvety/ui` — do not duplicate font-size classes in apps or the browser extension.

1. **CSS safety net:** `@helvety/ui/form-control-touch.css` (imported by `@helvety/ui/globals.css` for zone apps and by the extension’s `globals.css`). Sets `font-size: 1rem` on touch/coarse-pointer devices for `input`, `select`, `textarea`, and `[contenteditable="true"]`.
2. **Tailwind constant:** `@helvety/ui/form-control-text-size` exports `FORM_CONTROL_TEXT_SIZE_CLASS` and `FORM_CONTROL_PROSE_SIZE_CLASS` (16px on touch, 14px on mouse desktop). Use only when authoring new shared primitives — not in app code.
3. **Approved primitives:** `@helvety/ui/input`, `@helvety/ui/textarea`, `@helvety/ui/native-select`, `@helvety/ui/tiptap-editor` (rich text), `@helvety/ui/date-picker`, `@helvety/ui/date-time-picker` (pass optional `id` for `FormField` / `htmlFor`). Entity link pickers use `@helvety/ui/input` inside `@helvety/ui/entity-links-panel`. Never raw `<input>`, `<select>`, or `<textarea>` in `apps/*/components` or extension popup code.

Do **not** disable pinch zoom via viewport `maximum-scale=1` / `user-scalable=no`.

## Enforcement

- `scripts/check-consistency-guardrails.mjs` enforces:
  - `components.json` parity across every `apps/*` package that ships a UI surface.
  - `postcss.config.mjs` parity and `@helvety/ui` in production dependencies on every zone that uses shared PostCSS.
  - zero app imports from `@/components/ui/*` (shared primitives must come from `@helvety/ui/*`).
  - no raw `<select>` or `<textarea>` in `apps/*/components` (use `@helvety/ui/native-select` and `@helvety/ui/textarea`).
  - when `helvety-browser-extension-chromium` is present as a sibling repo: no raw form controls in `src/popup`, no local `Textarea.tsx`, and `src/globals.css` must import `@helvety/ui/globals.css` (or `@helvety/ui/form-control-touch.css`).
  - `bun.lock` must not contain `radix-ui`, `@radix-ui/*`, or `cmdk`.
