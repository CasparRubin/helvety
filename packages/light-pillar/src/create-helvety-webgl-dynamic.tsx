"use client";

import dynamic from "next/dynamic";

import { WEBGL_BACKDROP_UNDERLAY_CLASS } from "./webgl-backdrop";

import type { ComponentType } from "react";

/**
 * `next/dynamic` wrapper with SSR off and a `bg-background` loading slot (no transparent flash).
 * Client-only: import from `@helvety/light-pillar/webgl-dynamic`, not the package root.
 */
export function createHelvetyWebglDynamic<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  loadingTestId: string
) {
  return dynamic(loader, {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className={WEBGL_BACKDROP_UNDERLAY_CLASS}
        data-testid={loadingTestId}
      />
    ),
  });
}
