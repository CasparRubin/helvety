"use client";

/**
 * React Bits text animation presets (Shuffle eyebrow, ShinyText tagline).
 *
 * **Not mounted on production `/`.** {@link ./hero-marketing-shell} server-renders the live hero
 * (middle-dot company-values tagline via {@link ./hero-company-values-tagline}; no Shuffle/ShinyText).
 * {@link ./hero-side-rays-layer} adds client WebGL only. Keep this module for vendor refresh,
 * preset tuning, and {@link ./hero-text.test.tsx}.
 *
 * - **Shuffle**: eyebrow (`Software products`), replays every 5s; `respectReducedMotion` handles reduced motion internally.
 * - **Switzerland**: static Helvety red (`--brand-swiss-red` from `@helvety/ui/globals.css`).
 * - **Shiny Text**: experimental tagline preset (middle-dot separators; production uses the same copy in {@link ./hero-company-values-tagline}).
 *
 * Upstream: https://reactbits.dev/text-animations. Refresh via `bunx shadcn add @react-bits/…` (see `apps/web` README).
 */

import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { cn } from "@helvety/shared/utils";
import { useHtmlDarkTheme } from "@helvety/ui/use-html-dark-theme";
import { useReducedMotion } from "framer-motion";

import { HERO_COMPANY_VALUES_TAGLINE_DISPLAY } from "@/components/hero-company-values-copy";
import ShinyText from "@/components/vendor/ShinyText";
import Shuffle from "@/components/vendor/Shuffle";

/** Vendor ShinyText demo copy; production hero uses the same string via {@link ./hero-company-values-copy}. */
const TAGLINE = HERO_COMPANY_VALUES_TAGLINE_DISPLAY;

const TAGLINE_CLASS = "text-base tracking-[0.08em] md:text-lg";

/** Shiny Text demo color for dark mode. */
const TAGLINE_SHINY_COLOR_DARK = "rgba(255, 255, 255, 0.82)";
const TAGLINE_SHINE_COLOR_DARK = "#ffffff";

/** Shiny Text demo color for light mode. */
const TAGLINE_SHINY_COLOR_LIGHT = "rgba(0, 0, 0, 0.82)";
const TAGLINE_SHINE_COLOR_LIGHT = "#000000";

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
  return (
    <span className="text-brand-swiss-red font-medium">
      {HELVETY_SWISS_ORIGIN_COUNTRY}
    </span>
  );
}

/** Tagline: React Bits Shiny Text (https://reactbits.dev/text-animations/shiny-text) */
export function HeroTagline() {
  const reducedMotion = useReducedMotion();
  const isDark = useHtmlDarkTheme();

  if (reducedMotion) {
    return <p className={cn(TAGLINE_CLASS, "text-foreground/85")}>{TAGLINE}</p>;
  }

  const color = isDark ? TAGLINE_SHINY_COLOR_DARK : TAGLINE_SHINY_COLOR_LIGHT;
  const shineColor = isDark
    ? TAGLINE_SHINE_COLOR_DARK
    : TAGLINE_SHINE_COLOR_LIGHT;

  return (
    <p className={TAGLINE_CLASS}>
      <ShinyText
        text={TAGLINE}
        color={color}
        shineColor={shineColor}
        speed={2.4}
      />
    </p>
  );
}
