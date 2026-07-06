# @helvety/light-pillar

Shared WebGL backdrop utilities for the Helvety marketing homepage hero.

Used by `apps/web` only: React Bits **SideRays** via [`hero-side-rays-backdrop.tsx`](../../apps/web/components/hero-side-rays-backdrop.tsx). That component owns the **reveal wrapper** (`opacity-0` until `onReady`, then **2000ms** fade-in) and remounts WebGL after bfcache restore. [`hero-side-rays-layer.tsx`](../../apps/web/components/hero-side-rays-layer.tsx) skips mounting when `prefers-reduced-motion: reduce` or `canUseWebGL()` is false. This package supplies shared classes, timing helpers, and the WebGL probe only. Other public apps use semantic `bg-background` from `HelvetyPublicShellRootLayout` (blocking theme init in `<head>` on all scopes, including Store).

## Usage

```tsx
import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";

const HeroSideRays = createHelvetyWebglDynamic(
  () => import("@/components/vendor/SideRays"),
  "hero-side-rays-loading"
);
```

## Exports

| Export                                   | Purpose                                                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createHelvetyWebglDynamic`              | Client-only (`@helvety/light-pillar/webgl-dynamic`): `next/dynamic` + `bg-background` loading slot (hidden inside the gateway reveal wrapper until fade-in) |
| `scheduleWebglBackdropReady`             | Post-`onReady` rAF before backdrop fade-in                                                                                                                  |
| `WEBGL_BACKDROP_UNDERLAY_CLASS`          | Semantic `bg-background` underlay for WebGL init / dynamic loading                                                                                          |
| `WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS` | Opacity transition for hero backdrop fade-in (2000ms)                                                                                                       |
| `canUseWebGL`                            | Lightweight probe before mounting WebGL hero backdrops                                                                                                      |

## Testing

```bash
bun run test --filter=@helvety/light-pillar
```
