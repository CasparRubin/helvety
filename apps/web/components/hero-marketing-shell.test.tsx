import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
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

describe("HeroMarketingShell", () => {
  it("uses the country accent constant, not the full Swiss SEO closing", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toContain("HELVETY_SWISS_ORIGIN_COUNTRY");
    expect(src).not.toContain("HELVETY_SWISS_ORIGIN_SEO");
    expect(src).toContain("hero-company-values-copy");
    expect(src).toContain("HERO_COMPANY_VALUES_TAGLINE_DISPLAY");
    expect(src).toContain("HeroCompanyValuesTagline");
    expect(src).toContain("HeroSideRaysLayer");
    expect(src).toContain("lg:whitespace-nowrap");
    expect(src).toContain("text-base");
    expect(src).not.toContain("@helvety/ui/badge");
    expect(src).not.toContain("hero-text");
  });

  it("derives hero tagline text from shared company values (ASCII, no emoji)", () => {
    expect(HERO_COMPANY_VALUES_TAGLINE_TEXT).toBe(
      HELVETY_COMPANY_VALUES_TAGLINE.replace(/\.$/, "").toLowerCase()
    );
    expect(HERO_COMPANY_VALUES_TAGLINE_TEXT).toBe("private, simple, clean");
    expect(HERO_COMPANY_VALUES_TAGLINE_DISPLAY).toBe(
      "private · simple · clean"
    );
    expect(HERO_COMPANY_VALUES_TAGLINE_DISPLAY).not.toMatch(EMOJI_PATTERN);
  });

  it("server-renders hero copy and store CTA", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);
    const eyebrowHtml = html.match(/<p[^>]*>Software products<\/p>/)?.[0] ?? "";

    expect(eyebrowHtml).toContain("text-base");
    expect(eyebrowHtml).not.toMatch(/\btext-sm\b/);
    expect(html).toContain("Engineered, designed &amp; made in");
    expect(html).toContain("Switzerland");
    expect(html).toContain("text-brand-swiss-red");
    expect(html).not.toContain("Engineered, designed and made in Switzerland.");
    expect((html.match(/Engineered/gi) ?? []).length).toBe(1);
    expect(html).toContain("private · simple · clean");
    expect(html).not.toContain("private, simple, clean");
    expect(html).toContain("text-muted-foreground");
    expect(html).toContain("font-medium");
    expect(html).toContain("tracking-[0.08em]");
    expect(html).not.toContain("hero-side-rays-host");
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("/store");
    expect(html).not.toMatch(EMOJI_PATTERN);
  });
});
