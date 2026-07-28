"use client";

/**
 * Hero Switzerland line: React Bits RotatingText + static Switzerland.
 * Upstream: https://reactbits.dev/text-animations/rotating-text
 */

import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { useReducedMotion } from "framer-motion";

import RotatingText from "@/components/vendor/RotatingText";

/** Origin phrases cycled by RotatingText before static “, Switzerland”. */
export const HERO_SWITZERLAND_ROTATING_TEXTS = [
  "Made in Wallis",
  "Designed in Basel",
  "Engineered in Zürich",
] as const;

/** Static fallback when the user prefers reduced motion. */
export const HERO_SWITZERLAND_STATIC_LINE = `Made in Wallis, designed in Basel & engineered in Zürich, ${HELVETY_SWISS_ORIGIN_COUNTRY}`;

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
        Made in Wallis, designed in Basel &amp; engineered in Zürich,{" "}
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
          rotationInterval={5000}
        />
      </span>
      {", "}
      <span className="text-brand-swiss-red font-medium">
        {HELVETY_SWISS_ORIGIN_COUNTRY}
      </span>
    </p>
  );
}
