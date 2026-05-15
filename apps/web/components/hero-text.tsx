"use client";

/**
 * Helvety presets for React Bits hero text on `/` (see {@link ./hero-section}).
 *
 * - **Shuffle**: eyebrow (`Software products`), replays every 5s; `respectReducedMotion` handles reduced motion internally.
 * - **Switzerland**: static Helvety red (`#FF0000`).
 * - **Shiny Text**: tagline; muted static paragraph when `useReducedMotion()` is true.
 *
 * Upstream: https://reactbits.dev/text-animations. Refresh via `bunx shadcn add @react-bits/…` (see `apps/web` README).
 */

import { cn } from "@helvety/shared/utils";
import { useReducedMotion } from "framer-motion";

import ShinyText from "@/components/ShinyText";
import Shuffle from "@/components/Shuffle";

const TAGLINE = "private · simple · clean";

const TAGLINE_CLASS = "text-base tracking-[0.08em] md:text-lg";

/** Shiny Text base and shine (lighter / whiter over Hyperspeed). */
const TAGLINE_SHINY_COLOR = "rgba(255, 255, 255, 0.82)";
const TAGLINE_SHINE_COLOR = "#ffffff";

/** Seconds between Shuffle replays on the hero eyebrow (GSAP `loopDelay`). */
const HERO_SOFTWARE_PRODUCTS_SHUFFLE_LOOP_DELAY_S = 5;

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
      loop
      loopDelay={HERO_SOFTWARE_PRODUCTS_SHUFFLE_LOOP_DELAY_S}
    />
  );
}

/** Headline accent: static Helvety red. */
export function HeroSwitzerland() {
  return <span className="font-medium text-[#FF0000]">Switzerland</span>;
}

/** Tagline: React Bits Shiny Text (https://reactbits.dev/text-animations/shiny-text) */
export function HeroTagline() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <p className={cn(TAGLINE_CLASS, "text-foreground/85")}>{TAGLINE}</p>;
  }

  return (
    <p className={TAGLINE_CLASS}>
      <ShinyText
        text={TAGLINE}
        color={TAGLINE_SHINY_COLOR}
        shineColor={TAGLINE_SHINE_COLOR}
        speed={2.4}
      />
    </p>
  );
}
