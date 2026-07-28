"use client";

/**
 * Hero Switzerland line: React Bits Rotating Text + “in Switzerland”.
 * Upstream: https://reactbits.dev/text-animations/rotating-text
 */

import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { useReducedMotion } from "framer-motion";

import RotatingText from "@/components/vendor/RotatingText";

/** Verbs cycled by RotatingText before “in Switzerland”. */
export const HERO_SWITZERLAND_ROTATING_TEXTS = [
  "Engineered",
  "Designed",
  "Made",
] as const;

/** Static fallback when the user prefers reduced motion. */
export const HERO_SWITZERLAND_STATIC_LINE = `Engineered, designed & made in ${HELVETY_SWISS_ORIGIN_COUNTRY}`;

const HEADLINE_CLASS =
  "text-foreground text-center text-lg font-semibold tracking-tight sm:text-xl md:text-2xl lg:text-[1.75rem] lg:leading-snug";

/**
 * Production hero origin line with RotatingText (respects reduced motion).
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
    <p className={HEADLINE_CLASS}>
      <span className="inline-block overflow-hidden align-bottom">
        <RotatingText
          texts={[...HERO_SWITZERLAND_ROTATING_TEXTS]}
          staggerDuration={0.025}
          staggerFrom="last"
          rotationInterval={4000}
        />
      </span>
      {" in "}
      <span className="text-brand-swiss-red font-medium">
        {HELVETY_SWISS_ORIGIN_COUNTRY}
      </span>
    </p>
  );
}
