"use client";

/**
 * Hero Switzerland line: React Bits Rotating Text for Engineered / Designed / Made,
 * plus static “in Switzerland” accent.
 *
 * Upstream: https://reactbits.dev/text-animations/rotating-text
 */

import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { cn } from "@helvety/shared/utils";
import { useReducedMotion } from "framer-motion";

import RotatingText from "@/components/vendor/RotatingText";

/** Verbs cycled by Rotating Text before “in Switzerland”. */
export const HERO_SWITZERLAND_ROTATING_TEXTS = [
  "Engineered",
  "Designed",
  "Made",
] as const;

/** Static fallback when the user prefers reduced motion. */
export const HERO_SWITZERLAND_STATIC_LINE = `Engineered, designed & made in ${HELVETY_SWISS_ORIGIN_COUNTRY}`;

const HEADLINE_CLASS =
  "text-foreground text-lg font-semibold tracking-tight text-balance sm:text-xl md:text-2xl lg:text-[1.75rem] lg:leading-snug";

/**
 * Production hero origin line with Rotating Text (respects reduced motion).
 */
export function HeroSwitzerlandHeadline() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <p className={HEADLINE_CLASS}>
        Engineered, designed &amp; made in{" "}
        <span className="text-brand-swiss-red font-medium">
          {HELVETY_SWISS_ORIGIN_COUNTRY}
        </span>
      </p>
    );
  }

  return (
    <p
      className={cn(
        HEADLINE_CLASS,
        "inline-flex flex-wrap items-baseline justify-center gap-x-2"
      )}
    >
      <span className="relative inline-flex overflow-hidden pb-0.5">
        <RotatingText
          texts={[...HERO_SWITZERLAND_ROTATING_TEXTS]}
          rotationInterval={2200}
          staggerDuration={0.025}
          staggerFrom="last"
          splitBy="characters"
          loop
          auto
          mainClassName="justify-center overflow-hidden"
          elementLevelClassName="text-foreground"
        />
      </span>
      <span>
        in{" "}
        <span className="text-brand-swiss-red font-medium">
          {HELVETY_SWISS_ORIGIN_COUNTRY}
        </span>
      </span>
    </p>
  );
}
