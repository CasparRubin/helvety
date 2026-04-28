import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HeroSection } from "./hero-section";

import type { ComponentProps, ReactNode, SVGProps } from "react";

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

vi.mock("@helvety/brand/logo", () => ({
  HelvetyLogo: (props: SVGProps<SVGSVGElement>) => (
    <svg data-testid="helvety-logo" {...props} />
  ),
}));

vi.mock("framer-motion", () => ({
  LazyMotion: ({ children }: { children: ReactNode }) => <>{children}</>,
  domAnimation: {},
  m: {
    div: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

describe("HeroSection", () => {
  it("renders the store CTA with local href", () => {
    const html = renderToStaticMarkup(<HeroSection />);

    expect(html).toContain('href="/store"');
    expect(html).toContain("Browse Helvety products");
  });
});
