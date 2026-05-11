import { getLocalAppHref, urls } from "@helvety/shared/config";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeroSection } from "./hero-section";

import type { ComponentProps, ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const motionMocks = vi.hoisted(() => ({
  prefersReducedMotion: false,
}));

vi.mock("framer-motion", () => ({
  LazyMotion: ({ children }: { children: ReactNode }) => <>{children}</>,
  domAnimation: {},
  m: {
    div: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => motionMocks.prefersReducedMotion,
}));

describe("HeroSection", () => {
  beforeEach(() => {
    motionMocks.prefersReducedMotion = false;
  });

  it("renders headline, tagline, store CTA via getLocalAppHref; no legacy identifier markup", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain(`href="${getLocalAppHref(urls.store)}"`);
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("private · simple · clean");
    expect(html).toContain("Engineered, designed");
    expect(html).toContain("Switzerland");
    expect(html).not.toContain("helvety-identifier");
  });

  it("mounts Hyperspeed bleed layer with full-viewport width, grab cursor, and pointer-events split", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('data-testid="hero-hyperspeed-host"');
    expect(html).toContain("hero-hyperspeed-bleed");
    expect(html).toContain("w-[100svw]");
    expect(html).toContain("cursor-grab");
    expect(html).toContain("active:cursor-grabbing");
    expect(html).toContain("isolate");
    expect(html).toContain("overflow-visible");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("pointer-events-auto");
    expect(html).not.toContain("cursor-zoom-in");
    expect(html).not.toContain("cursor-zoom-out");
    expect(html).toContain("hero-tagline-glow");
    expect(html).not.toContain("w-full max-w-xs sm:w-auto");
  });

  it("uses flex growth and svh-derived min-height shell floor for hero layout", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain("flex-1");
    expect(html).toContain("min-h-[max(100%,calc(100svh-4rem-12.5rem))]");
    expect(html).toContain("flex-col justify-center");
    expect(html).toContain("max-w-3xl");
  });

  it("omits Hyperspeed and backgrounds the section when reduced motion is preferred", () => {
    motionMocks.prefersReducedMotion = true;
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).not.toContain('data-testid="hero-hyperspeed-host"');
    expect(html).not.toContain("hero-hyperspeed-bleed");
    expect(html).not.toContain("hero-tagline-glow");
    expect(html).toContain("text-muted-foreground");
    expect(html).toContain("bg-background");
  });
});
