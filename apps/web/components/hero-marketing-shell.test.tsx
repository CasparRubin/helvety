import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/hero-hyperspeed-layer", () => ({
  HeroHyperspeedLayer: () => <div data-testid="hero-hyperspeed-layer" />,
}));

import { HeroMarketingShell } from "./hero-marketing-shell";

describe("HeroMarketingShell", () => {
  it("server-renders hero copy and store CTA", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);

    expect(html).toContain("Software products");
    expect(html).toContain("Engineered, designed &amp; made in");
    expect(html).toContain("private · simple · clean");
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("/store");
  });
});
