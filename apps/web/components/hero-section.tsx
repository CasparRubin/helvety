"use client";

import { HelvetyIdentifier } from "@helvety/brand/identifier";
import { getLocalAppHref, urls } from "@helvety/shared/config";
import { Button } from "@helvety/ui/button";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const noMotion = { initial: {}, animate: {}, transition: { duration: 0 } };
const noStagger = { initial: {}, animate: {} };

const identifierTileClassName =
  "aspect-square size-full overflow-hidden rounded-2xl shadow-lg";

const identifierFloatTransition = {
  duration: 16,
  repeat: Number.POSITIVE_INFINITY,
  ease: "easeInOut" as const,
};

/** Marketing hero: text + store CTA stacked; identifier + motion from `md` (two-column). */
export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const isFirefox =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("firefox");

  const identifierMark = (
    <HelvetyIdentifier
      aria-label="Helvety mark"
      className={identifierTileClassName}
    />
  );

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative w-full min-w-0 overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20 lg:pt-32">
        <div
          className="from-background via-background to-background/80 pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b"
          aria-hidden="true"
        />
        <div
          className="hero-bg-pattern pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="hero-bg-pattern-draw" aria-hidden="true" />
        </div>

        <m.div
          variants={prefersReducedMotion ? noStagger : staggerContainer}
          initial="initial"
          animate="animate"
          className="relative z-10 mx-auto grid w-full max-w-6xl min-w-0 grid-cols-1 items-start gap-8 md:grid-cols-2 md:items-center md:gap-10 lg:gap-12"
        >
          <m.div
            variants={prefersReducedMotion ? noMotion : fadeInUp}
            className="flex min-w-0 flex-col gap-8 text-center lg:text-left"
          >
            <div className="space-y-4">
              <p className="text-foreground/80 text-xs font-medium tracking-[0.12em] uppercase md:text-sm">
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

            <div className="flex flex-col items-center gap-2 lg:items-start">
              <Button size="lg" asChild>
                <Link href={getLocalAppHref(urls.store)}>
                  <PackageOpen className="size-5" aria-hidden="true" />
                  Browse Helvety products
                  <ChevronRight
                    className="size-4 transition-transform group-hover/button:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <p className="text-muted-foreground max-w-md text-sm">
                Privacy-focused tools and apps. 100% free and open source.
              </p>
            </div>
          </m.div>

          <m.div
            variants={prefersReducedMotion ? noMotion : fadeInUp}
            className="hero-visual-panel relative hidden w-full min-w-0 justify-center pt-2 md:flex md:pt-0"
          >
            <div
              className="hero-visual-orb hero-visual-orb-a"
              aria-hidden="true"
            />
            <div
              className="hero-visual-orb hero-visual-orb-b"
              aria-hidden="true"
            />
            <m.div
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : isFirefox
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.95 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : isFirefox
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1 }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : isFirefox
                    ? { duration: 0.6, ease: "easeOut" }
                    : { duration: 0.8, ease: "easeOut" }
              }
              className="hero-identifier-visual relative z-[1] flex w-full max-w-[min(268px,76vw)] justify-center sm:max-w-[min(284px,62vw)] md:max-w-[min(272px,48vw)] lg:max-w-[292px]"
            >
              {prefersReducedMotion ? (
                <div className="hero-identifier-float relative aspect-square size-full">
                  {identifierMark}
                </div>
              ) : (
                <m.div
                  className="hero-identifier-float relative aspect-square size-full"
                  animate={{
                    y: [0, -14, 7, 0],
                    rotate: [0, 1.45, -1.2, 0],
                  }}
                  transition={identifierFloatTransition}
                >
                  {identifierMark}
                </m.div>
              )}
            </m.div>
          </m.div>
        </m.div>
      </section>
    </LazyMotion>
  );
}
