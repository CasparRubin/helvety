"use client";

import { getLocalAppHref, urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { useHtmlDarkTheme } from "@helvety/ui/use-html-dark-theme";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import { HeroHyperspeedBackdrop } from "@/components/hero-hyperspeed-backdrop";
import {
  HeroSoftwareProducts,
  HeroSwitzerland,
  HeroTagline,
} from "@/components/hero-text";

import "./hero-hyperspeed-bleed.css";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

/** Text shadow on hero copy over the Hyperspeed road (dark mode). */
const COPY_SHADOW_DARK_MOTION_SAFE =
  "motion-safe:[text-shadow:0_2px_12px_rgb(0_0_0/0.9),0_0_48px_rgb(0_0_0/0.55)]";

/** Text shadow on hero copy over the Hyperspeed road (light mode). */
const COPY_SHADOW_LIGHT_MOTION_SAFE =
  "motion-safe:[text-shadow:0_1px_8px_rgb(255_255_255/0.9),0_0_24px_rgb(250_248_247/0.8)]";

/**
 * Fill `#main-content` when flex allocates more than the svh estimate, and keep a viewport
 * floor when % height is fuzzy (matches shell: `h-svh` column minus nav + footer band).
 */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/**
 * Landing hero (`/`): React Bits Hyperspeed fullscreen behind copy + Store CTA (light and dark).
 *
 * - **Text:** {@link ./hero-text}: Shuffle eyebrow (5s loop), static red Switzerland, Shiny Text tagline;
 *   static/muted fallbacks when `useReducedMotion()` is true (wired to `MotionConfig reducedMotion="user"`).
 * - **Backdrop:** {@link HeroHyperspeedBackdrop}: entire layer hidden until {@link Hyperspeed}
 *   `onReady` (and `html.dark` matches the hook), then fades in over 700ms; theme toggle,
 *   cross-zone navigation, and `pagehide` hide the layer before unload. Skipped when
 *   reduced motion is preferred.
 * - **Block entrance:** Framer `fadeInUp` on the copy + CTA column (respects reduced motion via `MotionConfig`).
 */
export function HeroSection() {
  const isDark = useHtmlDarkTheme();
  const prefersReducedMotion = useReducedMotion();
  const showHyperspeed = !prefersReducedMotion;

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <section
          className={cn(
            "relative isolate flex w-full min-w-0 flex-1 flex-col justify-center overflow-visible",
            HERO_MIN_MAIN,
            !showHyperspeed && "bg-background",
            "motion-reduce:bg-background"
          )}
        >
          {showHyperspeed ? (
            <div
              className="hero-hyperspeed-bleed absolute inset-y-0 left-1/2 z-0 w-[100svw] max-w-none -translate-x-1/2 cursor-grab select-none active:cursor-grabbing motion-reduce:hidden"
              aria-hidden="true"
              data-testid="hero-hyperspeed-host"
            >
              <HeroHyperspeedBackdrop />
            </div>
          ) : null}

          <m.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="pointer-events-none relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 text-center md:px-6"
          >
            <div
              className={cn(
                "space-y-5",
                showHyperspeed &&
                  (isDark
                    ? COPY_SHADOW_DARK_MOTION_SAFE
                    : COPY_SHADOW_LIGHT_MOTION_SAFE)
              )}
            >
              <HeroSoftwareProducts />
              <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[2.75rem] lg:leading-[1.1]">
                Engineered, designed &amp; made in <HeroSwitzerland />
              </h1>
              <HeroTagline />
            </div>

            <Button size="lg" asChild className="pointer-events-auto">
              <Link href={getLocalAppHref(urls.store)}>
                <PackageOpen className="size-5" aria-hidden="true" />
                Browse Helvety products
                <ChevronRight
                  className="size-4 transition-transform group-hover/button:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </m.div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
