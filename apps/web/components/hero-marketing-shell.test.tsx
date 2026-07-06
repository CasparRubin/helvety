import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  HERO_COMPANY_VALUE_PILLS,
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
    expect(src).toContain("HERO_COMPANY_VALUES_TAGLINE");
    expect(src).toContain("HERO_COMPANY_VALUE_PILLS");
    expect(src).toContain("Lock");
    expect(src).toContain("Minimize2");
    expect(src).toContain("Sparkles");
    expect(src).toContain("@helvety/ui/badge");
    expect(src).toContain('variant="outline"');
    expect(src).toContain("lg:whitespace-nowrap");
    expect(src).toContain("text-base");
    expect(src).toContain("flex flex-wrap items-center justify-center gap-2");
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

  it("derives one pill per company value with icons", () => {
    expect(HERO_COMPANY_VALUE_PILLS.map((pill) => pill.label)).toEqual([
      "private",
      "simple",
      "clean",
    ]);
    for (const pill of HERO_COMPANY_VALUE_PILLS) {
      expect(pill.icon).toBeDefined();
    }
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
    expect(html).toContain("private");
    expect(html).toContain("simple");
    expect(html).toContain("clean");
    expect(html).not.toContain("private, simple, clean");
    expect(html).toContain(
      'class="flex flex-wrap items-center justify-center gap-2"'
    );
    expect(html).toContain("Browse Helvety products");
    expect(html).toContain("/store");
    expect(html).not.toMatch(EMOJI_PATTERN);
  });

  it("renders company values in three shadcn outline Badges with icons", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);
    const badgeMatches = [
      ...html.matchAll(/<span[^>]*data-slot="badge"[^>]*>[\s\S]*?<\/span>/g),
    ];

    expect(badgeMatches).toHaveLength(3);

    const labels = ["private", "simple", "clean"] as const;

    for (const [index, match] of badgeMatches.entries()) {
      const badgeHtml = match[0];

      expect(badgeHtml).toContain(labels[index]);
      expect(badgeHtml).toContain('data-variant="outline"');
      expect(badgeHtml).toContain("rounded-4xl");
      expect(badgeHtml).toContain("border-border/60");
      expect(badgeHtml).toContain("text-card-foreground");
      expect(badgeHtml).toContain("backdrop-blur-sm");
      expect(badgeHtml).toContain("<svg");
      expect(badgeHtml).not.toMatch(EMOJI_PATTERN);
    }

    const combinedBadgeHtml = badgeMatches.map((match) => match[0]).join("");

    expect(combinedBadgeHtml).toContain("private");
    expect(combinedBadgeHtml).toContain("simple");
    expect(combinedBadgeHtml).toContain("clean");
    expect(combinedBadgeHtml).not.toContain("private, simple, clean");
  });
});
