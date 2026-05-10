"use client";

import { useEffect } from "react";

const CSS_VAR = "--helvety-scroll-port-px";
/** Matches SSR fallback in `globals.css` until the Radix viewport is measured. */
const FALLBACK = "calc(100dvh - 4rem - 7.5rem)";

/**
 * Syncs `--helvety-scroll-port-px` on `<html>` with the real ScrollArea viewport
 * height (navbar + footer already excluded). Needed because marketing bands must
 * fill the scroll port, not `100dvh`.
 */
export function ScrollViewportMetricsBridge(): null {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const vp = document.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]'
      );
      if (!vp || vp.clientHeight < 1) {
        root.style.setProperty(CSS_VAR, FALLBACK);
        return;
      }
      root.style.setProperty(CSS_VAR, `${vp.clientHeight}px`);
    };

    const run = () => {
      sync();
      requestAnimationFrame(sync);
    };

    run();

    const vp = document.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    const ro = vp ? new ResizeObserver(run) : null;
    if (vp && ro) ro.observe(vp);

    window.addEventListener("resize", run);
    window.addEventListener("orientationchange", run);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", run);
      window.removeEventListener("orientationchange", run);
    };
  }, []);

  return null;
}
