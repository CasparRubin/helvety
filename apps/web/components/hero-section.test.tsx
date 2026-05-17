import { getLocalAppHref, urls } from "@helvety/shared/config";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeroSection } from "./hero-section";

import type { ComponentProps, ReactNode } from "react";

const heroMocks = vi.hoisted(() => ({
  isDark: false,
  prefersReducedMotion: false,
}));

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

vi.mock("@helvety/ui/use-html-dark-theme", () => ({
  useHtmlDarkTheme: () => heroMocks.isDark,
}));

vi.mock("@/components/hero-hyperspeed-backdrop", () => ({
  HeroHyperspeedBackdrop: () => (
    <div data-testid="hero-hyperspeed-backdrop-mock" />
  ),
}));

vi.mock("framer-motion", () => ({
  LazyMotion: ({ children }: { children: ReactNode }) => <>{children}</>,
  MotionConfig: ({ children }: { children: ReactNode }) => <>{children}</>,
  domAnimation: {},
  useReducedMotion: () => heroMocks.prefersReducedMotion,
  m: {
    div: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
}));

/* Isolate layout/SSR from React Bits + GSAP; preset wiring is covered in hero-text.test.tsx */
vi.mock("@/components/hero-text", () => ({
  HeroSoftwareProducts: () => (
    <p data-testid="hero-software-products">Software products</p>
  ),
  HeroSwitzerland: () => (
    <span className="font-medium text-[#FF0000]" data-testid="hero-switzerland">
      Switzerland
    </span>
  ),
  HeroTagline: () => <p data-testid="hero-tagline">private · simple · clean</p>,
}));

describe("HeroSection", () => {
  beforeEach(() => {
    heroMocks.isDark = false;
    heroMocks.prefersReducedMotion = false;
  });

  it("renders hero copy slots, headline, tagline, and store CTA", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('data-testid="hero-software-products"');
    expect(html).toContain('data-testid="hero-switzerland"');
    expect(html).toContain('data-testid="hero-tagline"');
    expect(html).toContain(`href="${getLocalAppHref(urls.store)}"`);
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("private · simple · clean");
    expect(html).toContain("Software products");
    expect(html).toContain("Engineered, designed");
    expect(html).toContain("Switzerland");
    expect(html).not.toContain("helvety-identifier");
  });

  it("SSR light: no hyperspeed host; themed background and layout shell", () => {
    heroMocks.isDark = false;
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).not.toContain('data-testid="hero-hyperspeed-host"');
    expect(html).toContain("bg-background");
    expect(html).toContain("motion-reduce:bg-background");
    expect(html).toContain("dark:motion-safe:[text-shadow:");
    expect(html).toContain("isolate");
    expect(html).toContain("overflow-visible");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("pointer-events-auto");
    expect(html).toContain("text-[#FF0000]");
    expect(html).toContain("flex-1");
    expect(html).toContain("min-h-[max(100%,calc(100svh-4rem-12.5rem))]");
    expect(html).toContain("max-w-3xl");
  });

  it("light mode: does not mount hyperspeed host", () => {
    heroMocks.isDark = false;
    heroMocks.prefersReducedMotion = false;
    render(<HeroSection />);

    expect(
      screen.queryByTestId("hero-hyperspeed-host")
    ).not.toBeInTheDocument();
  });

  it("dark mode: mounts hyperspeed host behind copy", () => {
    heroMocks.isDark = true;
    heroMocks.prefersReducedMotion = false;
    render(<HeroSection />);

    expect(screen.getByTestId("hero-hyperspeed-host")).toBeInTheDocument();
    expect(
      screen.getByTestId("hero-hyperspeed-backdrop-mock")
    ).toBeInTheDocument();
  });

  it("reduced motion: skips hyperspeed even in dark mode", () => {
    heroMocks.isDark = true;
    heroMocks.prefersReducedMotion = true;
    render(<HeroSection />);

    expect(
      screen.queryByTestId("hero-hyperspeed-host")
    ).not.toBeInTheDocument();
  });
});
