"use client";

import { StoreLightPillarBackdrop } from "@/components/store-light-pillar-backdrop";

import type { ReactNode } from "react";

/**
 * Wraps the Store public shell with a fixed Light Pillar backdrop on all routes.
 * Content stacks at `z-10` above a `pointer-events-none` fixed layer (`z-0`).
 * `prefers-reduced-motion: reduce`: hides the WebGL host (`motion-reduce:hidden`)
 * and shows a full-viewport `bg-background` fallback (`motion-reduce:block`).
 */
export function StoreShellWithBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 motion-reduce:hidden"
        data-testid="store-shell-backdrop-fixed-host"
      >
        <StoreLightPillarBackdrop />
      </div>
      <div
        aria-hidden
        className="bg-background absolute inset-0 z-0 hidden motion-reduce:block"
        data-testid="store-shell-backdrop-reduce-fallback"
      />
      <div className="relative z-10" data-testid="store-shell-backdrop-content">
        {children}
      </div>
    </div>
  );
}
