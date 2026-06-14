import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const shellPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "hero-marketing-shell.tsx"
);

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
  it("uses the country accent constant, not the full Swiss SEO closing", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toContain("HELVETY_SWISS_ORIGIN_COUNTRY");
    expect(src).not.toContain("HELVETY_SWISS_ORIGIN_SEO");
    expect(src).toContain("lg:whitespace-nowrap");
    expect(src).not.toContain("hero-text");
  });

  it("server-renders hero copy and store CTA", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);

    expect(html).toContain("Software products");
    expect(html).toContain("Engineered, designed &amp; made in");
    expect(html).toContain("Switzerland");
    expect(html).toContain("text-brand-swiss-red");
    expect(html).not.toContain("Engineered, designed and made in Switzerland.");
    expect((html.match(/Engineered/gi) ?? []).length).toBe(1);
    expect(html).toContain("private · simple · clean");
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("/store");
  });
});
