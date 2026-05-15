# @helvety/light-pillar

Shared React Bits **Light Pillar** shell backdrop for Helvety public apps (**Store**, **Auth**).

Not used on the gateway (`apps/web`): the marketing homepage uses React Bits **Hyperspeed** plus text animations in the hero ([`hero-hyperspeed-backdrop.tsx`](../../apps/web/components/hero-hyperspeed-backdrop.tsx), [`hero-text.tsx`](../../apps/web/components/hero-text.tsx)), which use a different reveal pattern (viewport black veil) than Light Pillar. Light Pillar keeps shell UI on `bg-background` and fades in a fixed WebGL layer behind content—no full-screen veil over the UI.

## Usage

```tsx
import { HelvetyShellWithLightPillarBackdrop } from "@helvety/light-pillar";

// In wrapInsideTooltipProvider (inside CSRF; Auth also wraps EncryptionProvider):
<HelvetyShellWithLightPillarBackdrop>
  {shell}
</HelvetyShellWithLightPillarBackdrop>;
```

## Reveal sequence

1. Shell children render immediately on `bg-background` (navbar, main, cards).
2. After two animation frames (`waitForShellContentPainted`), the WebGL chunk loads inside a fixed host at `opacity-0` (behind content, `z-0`).
3. When the pillar reports ready (`onReady`), the fixed host fades to `opacity-100` over **700ms** `ease-out`.
4. `prefers-reduced-motion: reduce`: no WebGL; static `bg-background` fallback only.

A **local black underlay** sits under the WebGL host while the canvas initializes (and in the dynamic `loading` slot). It is not a viewport veil over shell content.

## Preset

`HELVETY_LIGHT_PILLAR_OPTIONS` (`@helvety/light-pillar/preset`): React Bits template tuning with Helvety colors (`#ffffff` / `#ff102a`). `mixBlendMode` (`screen`) and `quality` (`high`) use component defaults.

## Exports

| Export                                 | Purpose                                             |
| -------------------------------------- | --------------------------------------------------- |
| `HelvetyShellWithLightPillarBackdrop`  | Fixed shell wrapper (content-first reveal)          |
| `HelvetyLightPillarBackdrop`           | WebGL layer + `onReady` (used by the shell wrapper) |
| `HELVETY_LIGHT_PILLAR_OPTIONS`         | Helvety colors and shader tuning                    |
| `waitForShellContentPainted`           | Double-rAF gate before mounting WebGL               |
| `LIGHT_PILLAR_REVEAL_TRANSITION_CLASS` | Opacity transition classes on the fixed host        |

Low-level `LightPillar` is available at `@helvety/light-pillar/light-pillar` if needed.

## Upstream

Vendored from [React Bits Light Pillar](https://reactbits.dev/backgrounds/light-pillar) (`LightPillar-TS-CSS`). To refresh: add the `@react-bits` registry to [`apps/store/components.json`](../../apps/store/components.json), run shadcn add from the Store app, then copy into `src/LightPillar.tsx` and `src/LightPillar.css` here.

## Testing

```bash
bun run test --filter=@helvety/light-pillar
```
