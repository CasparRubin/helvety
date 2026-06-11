"use client";

import { useReducedMotion } from "framer-motion";

import { HeroHyperspeedBackdrop } from "@/components/hero-hyperspeed-backdrop";

import "./hero-hyperspeed-bleed.css";

/**
 * Client-only Hyperspeed backdrop for the gateway hero.
 * Static copy is server-rendered in {@link HeroMarketingShell}.
 */
export function HeroHyperspeedLayer() {
  const prefersReducedMotion = useReducedMotion();
  const showHyperspeed = !prefersReducedMotion;

  if (!showHyperspeed) {
    return null;
  }

  return (
    <div
      className="hero-hyperspeed-bleed absolute inset-y-0 left-1/2 z-0 w-[100svw] max-w-none -translate-x-1/2 cursor-grab select-none active:cursor-grabbing motion-reduce:hidden"
      aria-hidden="true"
      data-testid="hero-hyperspeed-host"
    >
      <HeroHyperspeedBackdrop />
    </div>
  );
}
