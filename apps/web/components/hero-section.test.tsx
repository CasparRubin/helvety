import { getLocalAppHref, urls } from "@helvety/shared/config";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("framer-motion", () => ({
  LazyMotion: ({ children }: { children: ReactNode }) => <>{children}</>,
  MotionConfig: ({ children }: { children: ReactNode }) => <>{children}</>,
  domAnimation: {},
  m: {
    div: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("HeroSection", () => {
  it("renders headline, tagline, store CTA with gateway path href; no legacy identifier markup", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain(`href="${getLocalAppHref(urls.store)}"`);
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("private · simple · clean");
    expect(html).toContain("Engineered, designed");
    expect(html).toContain("Switzerland");
    expect(html).not.toContain("helvety-identifier");
  });

  it("SSR: hyperspeed host, motion-safe/motion-reduce hooks, and hero layout shell", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('data-testid="hero-hyperspeed-host"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("hero-hyperspeed-bleed");
    expect(html).toContain("motion-reduce:hidden");
    expect(html).toContain("motion-reduce:bg-background");
    expect(html).toContain("motion-safe:[text-shadow:");
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
    expect(html).toContain("flex-1");
    expect(html).toContain("min-h-[max(100%,calc(100svh-4rem-12.5rem))]");
    expect(html).toContain("flex-col justify-center");
    expect(html).toContain("max-w-3xl");
    /* HeroHyperspeedBackdrop: black underlay, veil (`transition-opacity`), chunk loading slot. */
    expect(html).toContain('data-testid="hero-hyperspeed-veil"');
    expect(html).toContain('data-testid="hero-hyperspeed-loading"');
    expect(html).toContain("bg-black");
    expect(html).toContain("transition-opacity");
  });
});
