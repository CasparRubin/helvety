"use client";

import { getLocalAppHref, urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import { HeroHyperspeedBackdrop } from "@/components/hero-hyperspeed-backdrop";

import "./hero-hyperspeed-bleed.css";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

/** Text shadow on hero copy when motion is allowed (Tailwind must see full arbitrary class). */
const COPY_SHADOW_MOTION_SAFE =
  "motion-safe:[text-shadow:0_2px_12px_rgb(0_0_0/0.9),0_0_48px_rgb(0_0_0/0.55)]";

/**
 * Fill `#main-content` when flex allocates more than the svh estimate, and keep a viewport
 * floor when % height is fuzzy (matches shell: `h-svh` column minus nav + footer band).
 */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/**
 * Landing hero (`/`): React Bits Hyperspeed fullscreen behind copy + Store CTA.
 * Backdrop: {@link HeroHyperspeedBackdrop}: black base, **black veil** fades out after
 * {@link Hyperspeed} `onReady` (first composited frame); WebGL stays opaque underneath.
 *
 * Hyperspeed host markup is identical on SSR and first client paint (`motion-reduce:*` for visuals;
 * WebGL skips init when `prefers-reduced-motion` is set (see {@link Hyperspeed}).
 *
 * Store CTA uses {@link getLocalAppHref} because this route runs on **`apps/web`** (no Next **`basePath`**).
 * Shell cross-app links use absolute **`urls.*`** instead; see **`AppSwitcher`** in `@helvety/ui`.
 */
export function HeroSection() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <section
          className={cn(
            /* Avoid `h-full`: % height often collapses before flex layout + scroll viewport are definite. */
            /* WebGL host uses `100svw` centered: keep section overflow visible so bleed isn’t clipped. */
            "relative isolate flex w-full min-w-0 flex-1 flex-col justify-center overflow-visible",
            HERO_MIN_MAIN,
            "motion-reduce:bg-background"
          )}
        >
          <div
            className="hero-hyperspeed-bleed absolute inset-y-0 left-1/2 z-0 w-[100svw] max-w-none -translate-x-1/2 cursor-grab select-none active:cursor-grabbing motion-reduce:hidden"
            aria-hidden="true"
            data-testid="hero-hyperspeed-host"
          >
            <HeroHyperspeedBackdrop />
          </div>

          <m.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="pointer-events-none relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 text-center md:px-6"
          >
            <div className={cn("space-y-5", COPY_SHADOW_MOTION_SAFE)}>
              <p className="text-foreground text-xs font-medium tracking-[0.12em] uppercase md:text-sm">
                Software products
              </p>
              <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[2.75rem] lg:leading-[1.1]">
                Engineered, designed &amp; made in{" "}
                <span className="font-medium text-[#FF0000]">Switzerland</span>
              </h1>
              <p className="hero-tagline-glow text-base tracking-[0.08em] md:text-lg">
                private · simple · clean
              </p>
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
