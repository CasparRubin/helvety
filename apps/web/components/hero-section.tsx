"use client";

import { getLocalAppHref, urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ChevronRight, PackageOpen } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { HERO_HYPERSPEED_EFFECT_OPTIONS } from "@/components/hero-hyperspeed-options";

import "./hero-hyperspeed-bleed.css";

/** WebGL hero backdrop; SSR off. */
const HeroHyperspeed = dynamic(() => import("@/components/Hyperspeed"), {
  ssr: false,
  loading: () => null,
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const noMotion = { initial: {}, animate: {}, transition: { duration: 0 } };

const copyShadow =
  "[text-shadow:0_2px_12px_rgb(0_0_0/0.9),0_0_48px_rgb(0_0_0/0.55)]";

/**
 * Fill `#main-content` when flex allocates more than the svh estimate, and keep a viewport
 * floor when % height is fuzzy (matches shell: `h-svh` column minus nav + footer band).
 */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/**
 * Landing hero (`/`): React Bits Hyperspeed fullscreen behind copy + Store CTA.
 * `effectOptions` use module-level {@link HERO_HYPERSPEED_EFFECT_OPTIONS} so mounted WebGL isn't torn down each render.
 */
export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <section
        className={cn(
          /* Avoid `h-full`: % height often collapses before flex layout + scroll viewport are definite. */
          /* WebGL host uses `100svw` centered — keep section overflow visible so bleed isn’t clipped. */
          "relative isolate flex w-full min-w-0 flex-1 flex-col justify-center overflow-visible",
          HERO_MIN_MAIN,
          prefersReducedMotion && "bg-background"
        )}
      >
        {!prefersReducedMotion ? (
          <div
            className="hero-hyperspeed-bleed absolute inset-y-0 left-1/2 z-0 w-[100svw] max-w-none -translate-x-1/2 cursor-grab select-none active:cursor-grabbing"
            aria-hidden="true"
            data-testid="hero-hyperspeed-host"
          >
            <HeroHyperspeed effectOptions={HERO_HYPERSPEED_EFFECT_OPTIONS} />
          </div>
        ) : null}

        <m.div
          variants={prefersReducedMotion ? noMotion : fadeInUp}
          initial="initial"
          animate="animate"
          className="pointer-events-none relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 text-center md:px-6"
        >
          <div className={cn("space-y-5", !prefersReducedMotion && copyShadow)}>
            <p className="text-foreground text-xs font-medium tracking-[0.12em] uppercase md:text-sm">
              Software products
            </p>
            <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[2.75rem] lg:leading-[1.1]">
              Engineered, designed &amp; made in{" "}
              <span className="font-medium text-[#FF0000]">Switzerland</span>
            </h1>
            <p className="text-muted-foreground text-base tracking-[0.08em] md:text-lg">
              private · simple · clean
            </p>
          </div>

          <Button
            size="lg"
            asChild
            className="pointer-events-auto w-full max-w-xs sm:w-auto"
          >
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
    </LazyMotion>
  );
}
