"use client";

import { HelvetyLogo } from "@helvety/brand/logo";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

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
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: browser detection on mount
    setIsFirefox(userAgent.indexOf("firefox") > -1);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative flex flex-col items-center px-6 pt-24 md:pt-40 lg:pt-48">
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
            className="logo-glow-wrapper flex justify-center"
          >
            <HelvetyLogo
              aria-label="Helvety logo"
              className="mx-auto h-auto w-[90vw] max-w-6xl"
            />
          </m.div>

          <m.div
            variants={prefersReducedMotion ? noStagger : staggerContainer}
            initial="initial"
            animate="animate"
            className="flex w-full flex-col items-center gap-8"
          >
            <m.div variants={prefersReducedMotion ? noMotion : fadeInUp}>
              <p className="text-muted-foreground text-sm md:text-base">
                Engineered & Designed in{" "}
                <span className="font-medium text-[#FF0000]">Switzerland</span>
              </p>
            </m.div>
          </m.div>
        </div>

        {/* Gradient overlay for depth */}
        <div className="from-background via-background to-background/80 absolute inset-0 -z-10 bg-gradient-to-b" />
      </section>
    </LazyMotion>
  );
}
