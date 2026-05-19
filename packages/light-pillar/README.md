# @helvety/light-pillar

Shared WebGL backdrop utilities for the Helvety marketing homepage hero.

Used by `apps/web` only: React Bits **Hyperspeed** via [`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx). Auth and Store use plain semantic `bg-background` from `HelvetyPublicShellRootLayout`.

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

| Export                                   | Purpose                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `createHelvetyWebglDynamic`              | Client-only (`@helvety/light-pillar/webgl-dynamic`): `next/dynamic` + `bg-background` loading slot |
| `scheduleWebglBackdropReady`             | Post-`onReady` rAF before veil lift                                                                |
| `WEBGL_BACKDROP_UNDERLAY_CLASS`          | Semantic `bg-background` underlay for WebGL init / dynamic loading                                 |
| `WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS` | Opacity transition for hero veil lift (700ms)                                                      |

## Testing

```bash
bun run test --filter=@helvety/light-pillar
```
