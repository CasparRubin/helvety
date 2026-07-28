import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  HERO_CLOUD_CTA_DESCRIPTION,
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
  HERO_PRODUCTS_CTA_DESCRIPTION,
  HERO_SWITZERLAND_ROTATING_TEXTS,
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
  it("wires Software Products title, company values, and Switzerland RotatingText island", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toContain("HeroSwitzerlandHeadline");
    expect(src).toContain("hero-switzerland-headline");
    expect(src).toContain("hero-company-values-copy");
    expect(src).toContain("HERO_COMPANY_VALUES_TAGLINE_DISPLAY");
    expect(src).toContain("HeroCompanyValuesTagline");
    expect(src).not.toMatch(/WebGL/);
    expect(src).toContain("Software Products");
    expect(src).not.toContain("HelvetyLogo");
    expect(src).not.toContain("@helvety/brand");
    expect(src).not.toContain("@helvety/ui/badge");
    expect(src).not.toContain("hero-text");
    expect(src).not.toContain("HELVETY_SWISS_ORIGIN_SEO");
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

  it("exposes Switzerland rotating city phrases for RotatingText", () => {
    expect([...HERO_SWITZERLAND_ROTATING_TEXTS]).toEqual([
      "Made in Wallis",
      "Designed in Basel",
      "Engineered in Zürich",
    ]);
  });

  it("server-renders hero copy with Cloud and Store CTAs", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);
    const hrefs = [...html.matchAll(/\bhref="([^"]*)"/g)].map(
      (match) => match[1]
    );

    expect(html).toMatch(/<h1[^>]*>Software Products<\/h1>/);
    expect(html).toContain("Made in Wallis");
    expect(html).toContain(", ");
    expect(html).toContain("Switzerland");
    expect(html).toContain("text-brand-swiss-red");
    expect(html).not.toContain("Engineered, designed and made in Switzerland.");
    expect(html).toContain("private · simple · clean");
    expect(html).not.toContain("private, simple, clean");
    expect(html).toContain("text-muted-foreground");
    expect(html).toContain("font-medium");
    expect(html).toContain("tracking-[0.08em]");
    expect(html).not.toContain("<canvas");
    expect(html).toContain("bg-background");
    expect(html).toContain("justify-center");
    expect(html).toContain("gap-12");
    expect(html).toContain("sm:gap-16");
    expect(html).toContain("max-w-md");
    expect(html).toContain("sm:max-w-2xl");
    expect(html).toContain("text-center sm:text-left");
    expect(html).toContain("hero-enter-brand");
    expect(html).toContain("hero-enter-ctas");
    expect(html).toContain("Helvety Cloud");
    expect(html).toContain("Browse other products");
    expect(html).toContain(HERO_CLOUD_CTA_DESCRIPTION);
    expect(html).toContain(HERO_PRODUCTS_CTA_DESCRIPTION);
    expect(html).not.toContain("Microsoft 365");
    expect(html).not.toContain("M365");
    expect(html).not.toContain("End-to-end encrypted open-space workspace");
    expect(html).not.toContain("Free browser tools and Microsoft 365 apps");
    expect(hrefs).toContain("https://helvety.cloud");
    expect(hrefs).toContain("/store/products");
    expect(hrefs).not.toContain("/store");
    expect(html).not.toMatch(EMOJI_PATTERN);
  });

  it("links Cloud via urls.cloud and Store via urls.storeProducts", () => {
    const src = readFileSync(shellPath, "utf8");
    expect(src).toContain("urls.cloud");
    expect(src).toContain("urls.storeProducts");
    expect(src).not.toContain("getLocalAppHref(urls.store)");
    expect(src).not.toContain("getLocalAppHref(urls.cloud)");
  });
});
