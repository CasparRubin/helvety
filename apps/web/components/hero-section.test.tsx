import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "./hero-section";

import type { ComponentProps, ReactNode, SVGProps } from "react";

const mockUseReducedMotion = vi.hoisted(
  (): {
    prefersReducedMotion: boolean | null;
  } => ({
    prefersReducedMotion: false,
  })
);

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

vi.mock("@helvety/brand/identifier", () => ({
  HelvetyIdentifier: (
    props: SVGProps<SVGSVGElement> & { edgeHighlight?: boolean }
  ) => {
    const { edgeHighlight, ...rest } = props;
    return (
      <svg
        data-testid="helvety-identifier"
        data-edge-highlight={String(edgeHighlight === true)}
        {...rest}
      />
    );
  },
}));

vi.mock("framer-motion", () => ({
  LazyMotion: ({ children }: { children: ReactNode }) => <>{children}</>,
  domAnimation: {},
  m: {
    div: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => mockUseReducedMotion.prefersReducedMotion,
}));

describe("HeroSection", () => {
  it("renders the store CTA with local href", () => {
    mockUseReducedMotion.prefersReducedMotion = false;
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('href="/store"');
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("private · simple · clean");
    expect(html).toContain("Engineered, designed");
    expect(html).toContain("Switzerland");
    expect(html).toContain("hero-identifier-float");
    expect(html).toContain("hero-visual-panel");
    expect(html).toContain('data-edge-highlight="true"');
  });

  it("uses a first-viewport band, vertical centering, bg pattern, and aligned grid columns", () => {
    mockUseReducedMotion.prefersReducedMotion = false;
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain("min-h-[calc(100dvh-4rem-7.5rem)]");
    expect(html).toContain("flex-col justify-center");
    expect(html).toContain("hero-bg-pattern");
    expect(html).toContain("hero-bg-pattern-draw");
    expect(html).toMatch(/grid-cols-1[^\n]*items-center/);
  });

  it("does not enable identifier edge highlight when reduced motion is preferred", () => {
    mockUseReducedMotion.prefersReducedMotion = true;
    try {
      const html = renderToStaticMarkup(<HeroSection />);
      expect(html).toContain('data-edge-highlight="false"');
    } finally {
      mockUseReducedMotion.prefersReducedMotion = false;
    }
  });
});
