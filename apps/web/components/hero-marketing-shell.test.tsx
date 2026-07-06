import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
  HeroMarketingShell,
} from "./hero-marketing-shell";

const shellPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "hero-marketing-shell.tsx"
);

/** Flags pictographs and most emoji sequences in customer-facing hero markup. */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

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

describe("HeroMarketingShell", () => {
  it("uses the country accent constant, not the full Swiss SEO closing", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toContain("HELVETY_SWISS_ORIGIN_COUNTRY");
    expect(src).not.toContain("HELVETY_SWISS_ORIGIN_SEO");
    expect(src).toContain("HELVETY_COMPANY_VALUES_TAGLINE");
    expect(src).toContain("@helvety/ui/badge");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("lg:whitespace-nowrap");
    expect(src).not.toContain("hero-text");
    expect(src).not.toMatch(/private\s*·\s*simple/);
  });

  it("derives hero tagline text from shared company values (ASCII, no emoji)", () => {
    expect(HERO_COMPANY_VALUES_TAGLINE_TEXT).toBe(
      HELVETY_COMPANY_VALUES_TAGLINE.replace(/\.$/, "").toLowerCase()
    );
    expect(HERO_COMPANY_VALUES_TAGLINE_TEXT).toBe("private, simple, clean");
    expect(HERO_COMPANY_VALUES_TAGLINE_TEXT).not.toMatch(EMOJI_PATTERN);
  });

  it("server-renders hero copy and store CTA", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);

    expect(html).toContain("Software products");
    expect(html).toContain("Engineered, designed &amp; made in");
    expect(html).toContain("Switzerland");
    expect(html).toContain("text-brand-swiss-red");
    expect(html).not.toContain("Engineered, designed and made in Switzerland.");
    expect((html.match(/Engineered/gi) ?? []).length).toBe(1);
    expect(html).toContain(HERO_COMPANY_VALUES_TAGLINE_TEXT);
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("/store");
    expect(html).not.toMatch(EMOJI_PATTERN);
  });

  it("renders the company values in a shadcn outline Badge with frosted surface", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);
    const badgeMatch = html.match(
      /<span[^>]*data-slot="badge"[^>]*>[\s\S]*?<\/span>/
    );

    expect(badgeMatch).not.toBeNull();
    const badgeHtml = badgeMatch?.[0] ?? "";

    expect(badgeHtml).toContain(HERO_COMPANY_VALUES_TAGLINE_TEXT);
    expect(badgeHtml).toContain('data-variant="outline"');
    expect(badgeHtml).toContain("rounded-4xl");
    expect(badgeHtml).toContain("border-border/60");
    expect(badgeHtml).toContain("text-card-foreground");
    expect(badgeHtml).toContain("backdrop-blur-sm");
    expect(badgeHtml).not.toContain("<svg");
    expect(badgeHtml).not.toMatch(EMOJI_PATTERN);
  });
});
