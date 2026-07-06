"use client";

import { canUseWebGL } from "@helvety/light-pillar";
import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

import { HeroSideRaysBackdrop } from "@/components/hero-side-rays-backdrop";

import "./hero-side-rays-bleed.css";

/**
 * Client-only SideRays backdrop for the gateway hero.
 * Skips mount when `prefers-reduced-motion` is set or `canUseWebGL()` is false.
 */
export function HeroSideRaysLayer() {
  const prefersReducedMotion = useReducedMotion();
  const webglAvailable = useSyncExternalStore(
    () => () => {},
    () => canUseWebGL(),
    () => false
  );
  const showSideRays = !prefersReducedMotion && webglAvailable;

  if (!showSideRays) {
    return null;
  }

  return (
    <div
      className="hero-side-rays-bleed absolute inset-y-0 left-1/2 z-0 w-[100svw] max-w-none -translate-x-1/2 motion-reduce:hidden"
      aria-hidden="true"
      data-testid="hero-side-rays-host"
    >
      <HeroSideRaysBackdrop />
    </div>
  );
}
