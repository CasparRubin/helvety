# Helvety Web

Gateway app for `helvety.com` and public legal/SEO surfaces.

**App URL:** <https://helvety.com>  
**Monorepo path:** `apps/web`

## Key Features

- **Home (`/`):** [`HeroMarketingShell`](components/hero-marketing-shell.tsx) from [`app/page.tsx`](app/page.tsx) server-renders static eyebrow (`text-base`), headline (Swiss origin accent), a simple company-values tagline (`private · simple · clean` from `HELVETY_COMPANY_VALUES_TAGLINE`) via [`HeroCompanyValuesTagline`](components/hero-company-values-tagline.tsx), and Store CTA; WebGL [**SideRays**](components/vendor/SideRays.tsx) mounts in the client-only [`HeroSideRaysLayer`](components/hero-side-rays-layer.tsx) (`createHelvetyWebglDynamic` from [`@helvety/light-pillar/webgl-dynamic`](../../packages/light-pillar/README.md); `ssr: false`). The rays use Helvety red `#F43F5E` and white from the **top-right** corner. The bleed host mounts when motion is allowed and WebGL is available (`canUseWebGL()` from `@helvety/light-pillar`); **`prefers-reduced-motion: reduce`** or missing WebGL skips the host and uses plain **`bg-background`**. When SideRays runs, the backdrop stays hidden until the first composited frame, then **fades in** over **2000ms**; bfcache restore remounts WebGL. CTA keeps **intrinsic width** on all breakpoints. React Bits **Shuffle / ShinyText** presets live in [`hero-text.tsx`](components/hero-text.tsx) for vendor refresh and tests; production `/` does **not** mount them.
- **Public shell:** [`app/layout.tsx`](app/layout.tsx) composes `HelvetyPublicShellRootLayout` (`mainVariant: "scroll-area"`; the shell injects `HelvetyThemeInitScript` in `<head>`). [`getGatewayShellLayoutProps`](lib/gateway-shell-props.ts) applies overflow escape props **only on `/`** so the hero’s full-bleed WebGL host can paint past scroll-area clipping; legal and other subpages keep the shell defaults (`overflow-hidden`). The proxy forwards `x-helvety-pathname` (`includeRequestPathname: true` on the `public-marketing` profile) for that routing. On `/`, the helper passes `scrollAreaViewportClassName` with `bg-background` so the scroll column matches the resolved theme. See [`packages/ui/README.md`](../../packages/ui/README.md). Root [`loading.tsx`](app/loading.tsx) uses shared `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`). SideRays WebGL utilities live in [`packages/light-pillar/README.md`](../../packages/light-pillar/README.md).
- **Legal pages (`/privacy`, `/terms`, `/impressum`):** shared shell via [`LegalPageShell`](components/legal-document.tsx) and [`legal.css`](app/legal.css). Privacy tables use `LegalTableWrap` + shadcn [`@helvety/ui/table`](../../packages/ui/src/table.tsx) (`layout="scroll"` for providers, `layout="cards"` with `data-label` for the §9 cookie table on small screens).
- Multi-zone gateway rewrites for `/auth`, `/store`, `/pdf`, `/image-upscaler`, `/image-editor`, `/tasks`, `/contacts`, `/notes`, `/links`
- Shared navigation across helvety.com web zones via `@helvety/ui/helvety-shell-navbar` (`app/layout.tsx` seeds `initialUser` through `bootstrapPublicLayoutUser()` so the bar does not flash loading when a session exists). The shell’s **AppSwitcher** uses absolute `urls.*` hrefs so it works from every zone’s Next **`basePath`**; marketing components on `/` may still use **`getLocalAppHref`** for path-shaped same-origin links (see [`packages/shared/README.md`](../../packages/shared/README.md) and [`packages/ui/README.md`](../../packages/ui/README.md)).
- `@helvety/shared/seo` (`createHelvetyProductMetadata`) plus `WEB_SITE_DESCRIPTION` / `HELVETY_WEB_DEFAULT_TITLE` from `@helvety/shared` for gateway metadata, Open Graph, Twitter, and JSON-LD (company positioning: Private, simple, clean; Swiss origin; no license terms in SEO)
- Public legal pages, cookie notice (shared footer; see Privacy for storage), and abuse-reporting entry points
- Canonical metadata and sitemap/robots endpoints for indexable content

## Routing and SEO

- Default title and description come from `HELVETY_WEB_DEFAULT_TITLE` and `WEB_SITE_DESCRIPTION` in [`app/layout.tsx`](app/layout.tsx); [`public/manifest.json`](public/manifest.json) and [`public/llms.txt`](public/llms.txt) stay aligned (tagline is company/product copy; AGPL details live under `## Licensing` in `llms.txt` only).
- Sub-app forwarding is defined in `next.config.ts`.
- All Helvety Next apps use `experimental.cssChunking: "strict"` via `@helvety/config/next`, which may reduce (not eliminate) unused CSS preload console warnings while `app/loading.tsx` or encryption gates are active.
- Direct-domain sub-app roots are expected to redirect to their base path.
- `apps/web` is indexable and serves:
  - `/robots.txt` (points crawlers at `/sitemap-index.xml`)
  - `/sitemap.xml` (home, impressum, privacy, terms; no `llms.txt`)
  - `/sitemap-index.xml` (index of public zone sitemaps: `web`, `store`, `pdf`, `image-upscaler`, `image-editor`)
- Private zones (`auth`, `contacts`, `notes`, `tasks`, `links`) are non-indexable, disallow crawl in zone `robots.txt`, and omit `sitemap.xml` routes (404).

## Security Model

- `proxy.ts` handles lightweight request setup (CSP headers + Supabase cookie refresh), not full auth enforcement. The gateway uses the **`public-marketing`** profile, which intentionally does **not** fail closed on auth refresh errors (stale `sb-*` cookies are not cleared at the gateway; session-bearing zone apps do). The gateway also sets **`includeRequestPathname: true`** so the root layout can scope SideRays overflow bleed to `/` only. The gateway uses a **custom** `config.matcher` (it must skip whole sub-apps like `/pdf`, `/image-upscaler`, and `/image-editor`), but the static-file extension suffix is kept aligned with zone apps (`SECURITY_PROXY_MATCHER` in `@helvety/shared/proxy`): paths ending in extensions such as `mjs`, `wasm`, and `json` bypass the proxy.
- CSRF cookie bootstrap is intentionally disabled in the web gateway by using the `public-marketing` security proxy profile (equivalent to `includeCsrf: false`) because state-changing auth/data actions execute in app-specific zones. The gateway therefore does **not** require `HELVETY_COOKIE_SIGNING_SECRET`.
- Redirect target validation is enforced in shared auth callback/action flows via shared redirect-validation utilities.
- Sensitive auth/data enforcement remains in app-specific zones (`auth`, `store`, `tasks`, `contacts`, `notes`, `links`).

## Environment Variables

Copy `env.template` to `.env.local`.

| Variable                               | Required                       | Server-only | Description                                     |
| -------------------------------------- | ------------------------------ | ----------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes                            | No          | Supabase project URL                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes                            | No          | Supabase publishable key                        |
| `AUTH_URL`                             | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for auth zone rewrites      |
| `STORE_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for store zone rewrites     |
| `PDF_URL`                              | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for PDF zone rewrites       |
| `IMAGE_UPSCALER_URL`                   | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for image-upscaler rewrites |
| `IMAGE_EDITOR_URL`                     | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for image-editor rewrites   |
| `TASKS_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for tasks zone rewrites     |
| `CONTACTS_URL`                         | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for contacts zone rewrites  |
| `NOTES_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for notes zone rewrites     |
| `LINKS_URL`                            | Vercel production (`VERCEL=1`) | Yes         | Internal Vercel URL for links zone rewrites     |

Local development falls back to localhost targets; production uses trusted internal hosts.

Optional monorepo variables are documented as comments in [`env.template`](./env.template). Shared behavior is in the root [`README.md`](../../README.md) Environment Model; Vercel Production/Preview setup: [`docs/env-vercel-audit-checklist.md`](../../docs/env-vercel-audit-checklist.md). Run `bun run consistency:local-env` from the repo root to audit local `.env.local` files.

## Development and Testing

Run from `apps/web`:

```bash
bun run dev
bun run test
bun run test:watch
bun run test:coverage
```

### React Bits (hero)

React Bits motion sources live under [`components/vendor/`](components/vendor/) (`SideRays.tsx`, `Shuffle.tsx`, `ShinyText.tsx`). Production `/` uses **server-rendered** copy in [`hero-marketing-shell.tsx`](components/hero-marketing-shell.tsx) (including simple middle-dot company-values tagline in [`HeroCompanyValuesTagline`](components/hero-company-values-tagline.tsx) from `HELVETY_COMPANY_VALUES_TAGLINE`) plus client WebGL in [`hero-side-rays-layer.tsx`](components/hero-side-rays-layer.tsx) / [`hero-side-rays-backdrop.tsx`](components/hero-side-rays-backdrop.tsx). [`hero-text.tsx`](components/hero-text.tsx) holds **Shuffle / ShinyText presets** for vendor refresh and unit tests ([`hero-text.test.tsx`](components/hero-text.test.tsx)); it is **not** imported by the production shell. Shell and WebGL tests: [`hero-marketing-shell.test.tsx`](components/hero-marketing-shell.test.tsx), [`hero-side-rays-layer.test.tsx`](components/hero-side-rays-layer.test.tsx), [`hero-side-rays-backdrop.test.tsx`](components/hero-side-rays-backdrop.test.tsx), [`SideRays.test.ts`](components/vendor/SideRays.test.ts). **`SideRays.tsx`** uses OGL; **`Shuffle.tsx`** uses GSAP; **`ShinyText.tsx`** imports **`framer-motion`** (not `motion/react`). Vitest mocks `framer-motion` in hero tests and stubs or tests SideRays/Shuffle separately. ESLint relaxes style rules for `components/vendor/**` in `@helvety/config` (no per-file `eslint-disable`).

Refresh text components from `apps/web` (CLI may write to `components/` first; move reconciled files into `components/vendor/` and keep imports aligned):

```bash
bunx shadcn add @react-bits/ShinyText-TS-TW @react-bits/Shuffle-TS-TW
```

Reconcile Helvety tweaks in [`hero-text.tsx`](components/hero-text.tsx) after refresh. [**SideRays**](components/vendor/SideRays.tsx) is maintained manually in `components/vendor/` (not the shadcn text registry).

For monorepo setup and `ci:check` / `ci:release` commands, use the root [`README.md`](../../README.md).

## Legal and Support

- Privacy: <https://helvety.com/privacy>
- Terms: <https://helvety.com/terms>
- Impressum and abuse reporting: <https://helvety.com/impressum#abuse>
- Contact: <mailto:contact@helvety.com>

## License

Licensed under the [GNU Affero General Public License v3.0 or later](../../LICENSE).
