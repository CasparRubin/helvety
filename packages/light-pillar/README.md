# @helvety/light-pillar

Shared React Bits **Light Pillar** shell backdrop for Helvety public apps (**Store**, **Auth**).

Not used on the gateway (`apps/web`): the marketing homepage uses React Bits **Hyperspeed** plus text animations in the hero ([`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx), [`hero-text.tsx`](../../apps/web/components/hero-text.tsx)). Hyperspeed runs in **light and dark** at all viewport widths with a **local semantic veil** (700ms); Light Pillar fades in a **fixed host** behind Auth/Store shell content on **md+** in **light or dark** (700ms)—neither pattern veils navbar or page UI. Brand pair: **dark = white + red**, **light = black + red**.

## Usage

```tsx
import { HelvetyShellWithLightPillarBackdrop } from "@helvety/light-pillar";

// In wrapInsideTooltipProvider (inside CSRF; Auth also wraps EncryptionProvider):
<HelvetyShellWithLightPillarBackdrop>
  {shell}
</HelvetyShellWithLightPillarBackdrop>;
```

## Reveal sequence

1. Shell children render immediately on `bg-background` (navbar, main, opaque cards) on every route and viewport. Controls over the pillar on **md+** (Auth login stepper, Store section nav) use opaque surfaces for contrast—see the matrix below.
2. **md+ (light or dark):** After two animation frames (`waitForShellContentPainted`), the WebGL chunk loads inside a fixed host at `opacity-0` (behind content, `z-0`). Colors come from `getHelvetyLightPillarOptions(isDark)` via `@helvety/ui/use-html-dark-theme`.
3. **md+:** When the pillar reports ready (`onReady`), the fixed host fades to `opacity-100` over **700ms** `ease-out`.
4. **Theme toggle (md+):** `html.dark` change remounts the backdrop (`key`) and re-runs the host reveal (`opacity-0` → `opacity-100`).
5. **Below md** (`<768px`, `@helvety/ui/use-is-mobile`): no WebGL; static `bg-background` via `max-md:block` (SSR-safe).
6. **`prefers-reduced-motion: reduce`:** no WebGL at any width; static `bg-background` (`md:block` + `motion-reduce:block`).

A **semantic `bg-background` underlay** sits under the WebGL host while the canvas initializes (and in the dynamic `loading` slot). It is not a viewport veil over shell content.

## Cross-app backdrop matrix

|                             | Auth / Store (Light Pillar)                                                                                                               | Web gateway (Hyperspeed hero)                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Scope                       | Wrapper on all routes; WebGL on **md+** light or dark (`HelvetyShellWithLightPillarBackdrop`)                                             | `/` hero only (Hyperspeed at all widths, light or dark)                  |
| Reveal                      | Fixed host `opacity-0` → `opacity-100` after shell paint + `onReady`                                                                      | Semantic **veil** fades out over opaque WebGL (no viewport veil over UI) |
| Content-first               | Double rAF (`waitForShellContentPainted`) before WebGL mount (md+ only)                                                                   | Mounts with hero when motion allowed                                     |
| Theme colors (md+ WebGL)    | **dark:** white + red · **light:** black + red pillar                                                                                     | **dark:** white + red · **light:** black + red road accents              |
| Compact viewport (`<768px`) | No WebGL; `bg-background` fallback block                                                                                                  | Hyperspeed stays on `/` at all sizes when motion allowed                 |
| Reduced motion              | No WebGL; `bg-background` fallback block                                                                                                  | `motion-reduce:hidden` host + `bg-background` section                    |
| Route loading               | `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`)                                                                    | Same                                                                     |
| Accent color                | `HELVETY_ACCENT_RED` from `@helvety/brand`                                                                                                | `HELVETY_ACCENT_RED_RGB` in hero car colors                              |
| Controls over pillar (md+)  | Auth: login `AuthStepper` opaque `bg-card` (`apps/auth/components/auth-stepper.tsx`); Store: `CommandBar` `variant="solid"` on `StoreNav` | N/A (hero copy sits over Hyperspeed, not Light Pillar)                   |

Shared WebGL plumbing (`scheduleWebglBackdropReady`, semantic underlay classes) lives in this package root export; `createHelvetyWebglDynamic` is client-only at `@helvety/light-pillar/webgl-dynamic` (used by web [`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx) and `HelvetyLightPillarBackdrop`).

## Preset

`getHelvetyLightPillarOptions(isDark)` (`@helvety/light-pillar/preset`): React Bits template tuning with brand pair **dark = white + red**, **light = black + red**. `mixBlendMode` is `screen` in dark and `multiply` in light; `quality` (`high`) uses the component default.

## Exports

| Export                                        | Purpose                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `HelvetyShellWithLightPillarBackdrop`         | Fixed shell wrapper (content-first reveal; WebGL on md+ light or dark; static bg below md or reduced motion) |
| `HelvetyLightPillarBackdrop`                  | WebGL layer + `onReady` (used by the shell wrapper)                                                          |
| `getHelvetyLightPillarOptions`                | Theme-aware Helvety colors and shader tuning                                                                 |
| `waitForShellContentPainted`                  | Double-rAF gate before mounting WebGL                                                                        |
| `WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS`      | Opacity transition on the fixed host (700ms)                                                                 |
| `WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS` | Same transition for hero veil lift                                                                           |
| `WEBGL_BACKDROP_UNDERLAY_CLASS`               | Semantic `bg-background` underlay for WebGL init / dynamic loading                                           |
| `createHelvetyWebglDynamic`                   | Client-only (`@helvety/light-pillar/webgl-dynamic`): `next/dynamic` + underlay loading slot                  |
| `scheduleWebglBackdropReady`                  | Post-`onReady` rAF before reveal                                                                             |

Low-level `LightPillar` is available at `@helvety/light-pillar/light-pillar` if needed.

## Upstream

Vendored from [React Bits Light Pillar](https://reactbits.dev/backgrounds/light-pillar) (`LightPillar-TS-CSS`). To refresh: add the `@react-bits` registry to [`apps/store/components.json`](../../apps/store/components.json), run shadcn add from the Store app, then copy into `src/LightPillar.tsx` and `src/LightPillar.css` here.

## Testing

```bash
bun run test --filter=@helvety/light-pillar
```
