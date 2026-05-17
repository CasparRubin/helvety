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
  });

  it("SSR: renders hyperspeed host when motion allowed (WebGL loads client-only)", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('data-testid="hero-hyperspeed-host"');
    expect(html).toContain('data-testid="hero-hyperspeed-backdrop-mock"');
  });

  it("client light mode: mounts hyperspeed host when motion allowed", () => {
    heroMocks.isDark = false;
    heroMocks.prefersReducedMotion = false;
    render(<HeroSection />);

    expect(screen.getByTestId("hero-hyperspeed-host")).toBeInTheDocument();
  });

  it("dark mode: mounts hyperspeed host behind copy", () => {
    heroMocks.isDark = true;
    render(<HeroSection />);

    expect(screen.getByTestId("hero-hyperspeed-host")).toBeInTheDocument();
    expect(
      screen.getByTestId("hero-hyperspeed-backdrop-mock")
    ).toBeInTheDocument();
  });

  it("reduced motion: skips hyperspeed", () => {
    heroMocks.prefersReducedMotion = true;
    render(<HeroSection />);

    expect(
      screen.queryByTestId("hero-hyperspeed-host")
    ).not.toBeInTheDocument();
  });

  it("applies light copy shadow when hyperspeed runs in light mode", () => {
    heroMocks.isDark = false;
    const { container } = render(<HeroSection />);
    const copy = container.querySelector(".space-y-5");

    expect(copy?.className).toContain("motion-safe:[text-shadow:");
    expect(copy?.className).toContain("255_255_255");
  });
});
