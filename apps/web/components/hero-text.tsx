"use client";

/**
 * Helvety presets for React Bits hero text on `/` (see {@link ./hero-section}).
 *
 * - **Shuffle**: eyebrow (`Software products`); `respectReducedMotion` handles reduced motion internally.
 * - **Gradient Text**: `Switzerland`; static red span when `useReducedMotion()` is true.
 * - **Shiny Text**: tagline; muted static paragraph when `useReducedMotion()` is true.
 *
 * Upstream: https://reactbits.dev/text-animations. Refresh via `bunx shadcn add @react-bits/…` (see `apps/web` README).
 */

import { cn } from "@helvety/shared/utils";
import { useReducedMotion } from "framer-motion";

import GradientText from "@/components/GradientText";
import ShinyText from "@/components/ShinyText";
import Shuffle from "@/components/Shuffle";

const TAGLINE = "private · simple · clean";

const TAGLINE_CLASS = "text-base tracking-[0.08em] md:text-lg";

/** Eyebrow: React Bits Shuffle (https://reactbits.dev/text-animations/shuffle) */
export function HeroSoftwareProducts() {
  return (
    <Shuffle
      text="Software products"
      tag="p"
      className="text-foreground !text-xs !leading-normal font-medium tracking-[0.12em] uppercase md:!text-sm"
      triggerOnHover={false}
      respectReducedMotion
      threshold={0.01}
    />
  );
}

/** Headline accent: React Bits Gradient Text (https://reactbits.dev/text-animations/gradient-text) */
export function HeroSwitzerland() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <span className="font-medium text-[#FF0000]">Switzerland</span>;
  }

  return (
    <GradientText
      showBorder={false}
      className="!inline-flex max-w-none cursor-default rounded-none p-0 font-medium !backdrop-blur-none"
      colors={["#FF0000", "#ff4d4d", "#ffffff", "#FF0000"]}
      animationSpeed={6}
      direction="horizontal"
    >
      Switzerland
    </GradientText>
  );
}

/** Tagline: React Bits Shiny Text (https://reactbits.dev/text-animations/shiny-text) */
export function HeroTagline() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <p className={cn(TAGLINE_CLASS, "text-muted-foreground")}>{TAGLINE}</p>
    );
  }

  return (
    <p className={TAGLINE_CLASS}>
      <ShinyText
        text={TAGLINE}
        color="rgba(255,255,255,0.55)"
        shineColor="#ffffff"
        speed={2.4}
      />
    </p>
  );
}
