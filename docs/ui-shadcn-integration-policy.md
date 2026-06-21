# UI / shadcn Integration Policy

This policy defines where UI primitives live and how apps should consume them.

## Source Of Truth

- Shared primitives and cross-app compositions live in `packages/ui/src`.
- App code should import shared primitives from `@helvety/ui/*`.
- **New shadcn CLI adds** should target `packages/ui/components.json` first, then re-export from `@helvety/ui/*`. App `components.json` files keep shadcn aliases (for example `"ui": "@/components/ui"`) for CLI compatibility only; **do not** create `apps/*/components/ui/` directories or import `@/components/ui/*` from app code. `consistency:guardrails` enforces `rsc: true`, `tsx: true`, and a `registries` object on every app UI surface.
- Shared date pickers live in `@helvety/ui/date-picker` and `@helvety/ui/date-time-picker` (not under any app).

## App-local UI (disallowed)

Do not add `apps/*/components/ui/*` primitives or feature wrappers under `@/components/ui`. Import shared primitives from `@helvety/ui/*` only. `consistency:guardrails` fails on any `@/components/ui/*` or `../ui/*` import under `apps/*/components/`.

## Gateway React Bits vendor folder (`apps/web`)

- Third-party React Bits sources (**Hyperspeed**, **Shuffle**, **ShinyText**) live in `apps/web/components/vendor/`, not the shared `packages/ui` package.
- Gateway hero: production `/` uses static SSR copy in `hero-marketing-shell.tsx` plus client WebGL in `hero-hyperspeed-layer.tsx` / `hero-hyperspeed-backdrop.tsx`. `hero-text.tsx` holds Shuffle/ShinyText presets for vendor refresh and tests; not wired into the production shell. The backdrop keeps Hyperspeed at `opacity-0` until the first composited WebGL frame with a matching `html.dark`, then fades in (700ms); it hides before cross-zone links and `pagehide`. Do not reintroduce a lifting “veil” over a visible canvas. Public shells inject blocking theme init in `<head>` (not after `SkipToContent`). Gateway overflow escape props (`!overflow-visible` on the public shell scroll column) apply **on `/` only** via `getGatewayShellLayoutProps` and the proxy’s `x-helvety-pathname` header; legal and other subpages keep default scroll clipping.
- **Legal tables (`apps/web`):** Privacy §5/§9 tables compose `@helvety/ui/table` inside `LegalTableWrap` / `LegalTable` (`apps/web/components/legal-document.tsx`, styles in `apps/web/app/legal.css`). Use `layout="scroll"` for wide tabular data or `layout="cards"` with `data-label` on cells for mobile-friendly disclosure tables; do not add raw `<table className="w-full">` blocks to legal pages.
- After `shadcn add @react-bits/...` from `apps/web`, reconcile Helvety tweaks and keep motion files under `components/vendor/` with imports updated in `hero-text.tsx`.
- Prefer the `**/components/vendor/**` ESLint override in `@helvety/config` over file-level `eslint-disable` in vendored files.

## Calendar and icon primitives

- **`@helvety/ui/calendar`** wraps **react-day-picker v10** (shadcn-style `classNames`, including `month_grid`). Use `@helvety/ui/date-picker` / `@helvety/ui/date-time-picker` for forms; do not pin day-picker v9 APIs or class keys.
- **Kebab-case icon names** in E2EE seed data (categories, stages, labels) resolve through **`@helvety/ui/icon-renderer`** (`getLucideIcon`, `renderIcon`). Use supported **lucide-react v1** names only; unknown names fall back to `circle`.

## Styling And Composition Rules

- **Tailwind / PostCSS:** zone apps import `@helvety/ui/globals.css` and re-export `@helvety/config/postcss` (plugin loaded from `@helvety/dev-deps`). Production `tailwindcss` and `@tailwindcss/postcss` on `@helvety/ui` keep Tailwind on zone apps’ production dependency graph for Turbopack; see [`vercel-monorepo-apps.md`](./vercel-monorepo-apps.md).
- Prefer semantic variants/tokens (`primary`, `secondary`, `destructive`, `muted`) over hardcoded palette classes. Gateway marketing accents use `--brand-swiss-red` / `text-brand-swiss-red` from `packages/ui/globals.css` (not raw `#FF0000` in components).
- Prefer reusable state primitives for list surfaces (`ListLoadingState`, `ListErrorState`, `ListEmptyState`, `ListEmptySearchState`).
- Use shared dashboard primitives (`EntityDashboardShell`) and command bars (`EntityCommandBar`) for list-centric entity apps.
- Pin command bars **outside** scroll: E2EE list/editor pages wrap toolbar + body in `CommandBarPageLayout` (scrolls via `@helvety/ui/scroll-area`); Store uses `scrollAreaMainPrefix` on `HelvetyPublicShellRootLayout` with `CommandBar` `variant="solid"` on `StoreNav` (opaque section nav); PDF, Docs, and image-upscaler pin `CommandBar` (`variant="solid"`) as a flex sibling above an `overflow-hidden` workspace (`mainVariant: "overflow-main"` on the public shell). Do not rely on CSS `sticky` on `CommandBar` for page-level pinning.
- **Scrollable sheets:** full-height slide-outs use `@helvety/ui/sheet-scroll-layout` (`SHEET_SCROLLABLE_SHELL_CLASS` on `SheetContent`, optional `SHEET_SCROLLABLE_BODY_CLASS` wrapper below a pinned header). List-style sheets (`AppSwitcher`, mobile nav menu, Docs vault sheet) put `ScrollArea` with `min-h-0 flex-1` directly under the header. E2EE entity detail sheets use `E2eeEntityDetailSheet` (body wrapper + `CommandBarPageLayout` in zone editors). Do not scroll the sheet root with raw `overflow-y-auto`; keep the flex height chain intact (`min-h-0`, `flex-1`, `overflow-hidden` on each flex child). Guarded by `sheet-scroll-wiring.test.ts` and `e2ee-dashboard-wiring.test.ts`.
- Use `NativeSelect` from `@helvety/ui/native-select` for consistent native select styling when the full custom select is not required.

## Mobile form controls (iOS input zoom)

iOS Safari zooms the page when a focused text field is below **16px**. Helvety uses **one shared system** in `@helvety/ui` — do not duplicate font-size classes in apps or the browser extension.

1. **CSS safety net:** `@helvety/ui/form-control-touch.css` (imported by `@helvety/ui/globals.css` for zone apps and by the extension’s `globals.css`). Sets `font-size: 1rem` on touch/coarse-pointer devices for `input`, `select`, `textarea`, and `[contenteditable="true"]`.
2. **Tailwind constant:** `@helvety/ui/form-control-text-size` exports `FORM_CONTROL_TEXT_SIZE_CLASS` and `FORM_CONTROL_PROSE_SIZE_CLASS` (16px on touch, 14px on mouse desktop). Use only when authoring new shared primitives — not in app code.
3. **Approved primitives:** `@helvety/ui/input`, `@helvety/ui/textarea`, `@helvety/ui/native-select`, `@helvety/ui/command` (`CommandInput`), `@helvety/ui/tiptap-editor` (rich text). Never raw `<input>`, `<select>`, or `<textarea>` in `apps/*/components` or extension popup code.

Do **not** disable pinch zoom via viewport `maximum-scale=1` / `user-scalable=no`.

## Enforcement

- `scripts/check-consistency-guardrails.mjs` enforces:
  - `components.json` parity across every `apps/*` package that ships a UI surface.
  - `postcss.config.mjs` parity and `@helvety/ui` in production dependencies on every zone that uses shared PostCSS.
  - zero app imports from `@/components/ui/*` (shared primitives must come from `@helvety/ui/*`).
  - no raw `<select>` or `<textarea>` in `apps/*/components` (use `@helvety/ui/native-select` and `@helvety/ui/textarea`).
  - when `helvety-browser-extension-chromium` is present as a sibling repo: no raw form controls in `src/popup`, no local `Textarea.tsx`, and `src/globals.css` must import `@helvety/ui/form-control-touch.css`.
