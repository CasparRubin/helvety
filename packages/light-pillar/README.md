# @helvety/light-pillar

Shared WebGL backdrop utilities for the Helvety marketing homepage hero.

Used by `apps/web` only: React Bits **Hyperspeed** via [`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx). That component owns the **reveal wrapper** (`opacity-0` until `onReady` with a stable `html.dark`, then 700ms fade-in) and hides before cross-zone navigation / `pagehide`; this package supplies shared classes and timing helpers only. Other public apps use semantic `bg-background` from `HelvetyPublicShellRootLayout` (blocking theme init in `<head>` on all scopes, including Store).

## Usage

```tsx
import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";

const HeroHyperspeed = createHelvetyWebglDynamic(
  () => import("@/components/vendor/Hyperspeed"),
  "hero-hyperspeed-loading"
);
```

## Exports

| Export                                   | Purpose                                                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createHelvetyWebglDynamic`              | Client-only (`@helvety/light-pillar/webgl-dynamic`): `next/dynamic` + `bg-background` loading slot (hidden inside the gateway reveal wrapper until fade-in) |
| `scheduleWebglBackdropReady`             | Post-`onReady` rAF before backdrop fade-in                                                                                                                  |
| `WEBGL_BACKDROP_UNDERLAY_CLASS`          | Semantic `bg-background` underlay for WebGL init / dynamic loading                                                                                          |
| `WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS` | Opacity transition for hero backdrop fade-in (700ms)                                                                                                        |

## Testing

```bash
bun run test --filter=@helvety/light-pillar
```
