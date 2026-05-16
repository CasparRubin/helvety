# @helvety/light-pillar

Shared React Bits **Light Pillar** shell backdrop for Helvety public apps (**Store**, **Auth**).

Not used on the gateway (`apps/web`): the marketing homepage uses React Bits **Hyperspeed** plus text animations in the hero ([`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx), [`hero-text.tsx`](../../apps/web/components/hero-text.tsx)). Hyperspeed lifts a **local black veil** over the WebGL layer inside the hero bleed host (700ms); Light Pillar fades in a **fixed host** behind shell content on **md+** (700ms)—neither pattern veils navbar or page UI.

## Usage

```tsx
import { HelvetyShellWithLightPillarBackdrop } from "@helvety/light-pillar";

// In wrapInsideTooltipProvider (inside CSRF; Auth also wraps EncryptionProvider):
<HelvetyShellWithLightPillarBackdrop>
  {shell}
</HelvetyShellWithLightPillarBackdrop>;
```

## Reveal sequence

1. Shell children render immediately on `bg-background` (navbar, main, opaque cards) on every route and viewport. Controls placed directly over the pillar on md+ (e.g. Auth login stepper, Store section nav) use opaque surfaces for contrast—see the matrix below.
2. **md+ only:** After two animation frames (`waitForShellContentPainted`), the WebGL chunk loads inside a fixed host at `opacity-0` (behind content, `z-0`).
3. **md+ only:** When the pillar reports ready (`onReady`), the fixed host fades to `opacity-100` over **700ms** `ease-out`.
4. **Below md** (`<768px`, Tailwind `md:` / `@helvety/ui/use-is-mobile`): no WebGL; static `bg-background` via `max-md:block` (SSR-safe) and no Three.js load.
5. **`prefers-reduced-motion: reduce`:** no WebGL at any width; static `bg-background` (`md:block` + `motion-reduce:block`).

A **local black underlay** sits under the WebGL host while the canvas initializes (and in the dynamic `loading` slot). It is not a viewport veil over shell content.

## Cross-app backdrop matrix

|                             | Auth / Store (Light Pillar)                                                                                                                     | Web gateway (Hyperspeed hero)                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Scope                       | Wrapper on all routes; WebGL on **md+** only (`HelvetyShellWithLightPillarBackdrop`)                                                            | `/` hero only (Hyperspeed at all widths)                              |
| Reveal                      | Fixed host `opacity-0` → `opacity-100` after shell paint + `onReady`                                                                            | Black **veil** fades out over opaque WebGL (no viewport veil over UI) |
| Content-first               | Double rAF (`waitForShellContentPainted`) before WebGL mount (md+ only)                                                                         | Mounts with hero                                                      |
| Compact viewport (`<768px`) | No WebGL; `bg-background` fallback block                                                                                                        | N/A (Hyperspeed stays on `/` at all sizes)                            |
| Reduced motion              | No WebGL; `bg-background` fallback block                                                                                                        | `motion-reduce:hidden` host + `bg-background` section                 |
| Route loading               | `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`)                                                                          | Same                                                                  |
| Accent color                | `HELVETY_ACCENT_RED` from `@helvety/brand`                                                                                                      | `HELVETY_ACCENT_RED_RGB` in hero car colors                           |
| Controls over pillar (md+)  | Auth: login `AuthStepper` opaque `bg-card` (`apps/auth/components/encryption-stepper.tsx`); Store: `CommandBar` `variant="solid"` on `StoreNav` | N/A (hero copy sits over Hyperspeed, not Light Pillar)                |

Shared WebGL plumbing (`scheduleWebglBackdropReady`, black underlay classes) lives in this package root export; `createHelvetyWebglDynamic` is client-only at `@helvety/light-pillar/webgl-dynamic` (used by web [`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx) and `HelvetyLightPillarBackdrop`).

## Preset

`HELVETY_LIGHT_PILLAR_OPTIONS` (`@helvety/light-pillar/preset`): React Bits template tuning with Helvety colors (`#ffffff` / `HELVETY_ACCENT_RED`). `mixBlendMode` (`screen`) and `quality` (`high`) use component defaults.

## Exports

| Export                                        | Purpose                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `HelvetyShellWithLightPillarBackdrop`         | Fixed shell wrapper (content-first reveal; WebGL gated at md+)                           |
| `HelvetyLightPillarBackdrop`                  | WebGL layer + `onReady` (used by the shell wrapper)                                      |
| `HELVETY_LIGHT_PILLAR_OPTIONS`                | Helvety colors and shader tuning                                                         |
| `waitForShellContentPainted`                  | Double-rAF gate before mounting WebGL                                                    |
| `WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS`      | Opacity transition on the fixed host (700ms)                                             |
| `WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS` | Same transition for hero veil lift                                                       |
| `createHelvetyWebglDynamic`                   | Client-only (`@helvety/light-pillar/webgl-dynamic`): `next/dynamic` + black loading slot |
| `scheduleWebglBackdropReady`                  | Post-`onReady` rAF before reveal                                                         |
| `LIGHT_PILLAR_REVEAL_TRANSITION_CLASS`        | Deprecated alias of `WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS`                             |

Low-level `LightPillar` is available at `@helvety/light-pillar/light-pillar` if needed.

## Upstream

Vendored from [React Bits Light Pillar](https://reactbits.dev/backgrounds/light-pillar) (`LightPillar-TS-CSS`). To refresh: add the `@react-bits` registry to [`apps/store/components.json`](../../apps/store/components.json), run shadcn add from the Store app, then copy into `src/LightPillar.tsx` and `src/LightPillar.css` here.

## Testing

```bash
bun run test --filter=@helvety/light-pillar
```
