"use client";

import { HelvetyLogo } from "@helvety/brand/logo";
import { getLocalAppHref, urls } from "@helvety/shared/config";
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

/**
 * Animated hero section with Firefox-specific animation handling
 * and prefers-reduced-motion support.
 */
export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const isFirefox =
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("firefox");

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative flex flex-col items-center px-6 pt-24 pb-[100px] md:pt-40 lg:pt-48">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
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
            className="logo-glow-wrapper mx-auto flex w-full max-w-[1400px] justify-center"
          >
            <HelvetyLogo
              aria-label="Helvety logo"
              className="h-auto w-full max-w-[1400px]"
            />
          </m.div>

          <m.div
            variants={prefersReducedMotion ? noStagger : staggerContainer}
            initial="initial"
            animate="animate"
            className="flex w-full flex-col items-center gap-8"
          >
            <m.div
              variants={prefersReducedMotion ? noMotion : fadeInUp}
              className="space-y-1.5"
            >
              <p className="text-muted-foreground text-sm md:text-base">
                Engineered, Designed & Made in{" "}
                <span className="font-medium text-[#FF0000]">Switzerland</span>
              </p>
              <p className="text-foreground/80 text-xs md:text-sm">
                Software products
              </p>
              <p className="text-muted-foreground/80 text-[11px] tracking-[0.08em] md:text-xs">
                private, simple, clean
              </p>
            </m.div>
            <m.div
              variants={prefersReducedMotion ? noMotion : fadeInUp}
              className="mt-8 flex w-full justify-center lg:mt-16"
            >
              <Link
                className="group ring-foreground/10 bg-card/80 text-card-foreground hover:bg-card focus-visible:ring-ring focus-visible:ring-offset-background inline-flex w-full max-w-xl items-center gap-4 rounded-xl px-4 py-3 text-left shadow-xs ring-1 backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                href={getLocalAppHref(urls.store)}
              >
                <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-full">
                  <PackageOpen className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium md:text-base">
                    Browse Helvety products
                  </span>
                  <span className="text-muted-foreground block text-xs md:text-sm">
                    Privacy-focused tools and apps. 100% free and open source.
                  </span>
                </span>
                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </m.div>
          </m.div>
        </div>

        {/* Gradient overlay for depth */}
        <div className="from-background via-background to-background/80 absolute inset-0 -z-10 bg-gradient-to-b" />
      </section>
    </LazyMotion>
  );
}
