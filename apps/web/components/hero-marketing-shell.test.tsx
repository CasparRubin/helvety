import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
  HERO_PRODUCTS_CTA_DESCRIPTION,
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
  it("wires open-source software title, company values, and static Switzerland line", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toContain("HELVETY_SWISS_ORIGIN_COUNTRY");
    expect(src).toContain("hero-company-values-copy");
    expect(src).toContain("HERO_COMPANY_VALUES_TAGLINE_DISPLAY");
    expect(src).toContain("HERO_MUTED_LINE_CLASS");
    expect(src).toContain("HeroCompanyValuesTagline");
    expect(src).not.toMatch(/WebGL/);
    expect(src).toContain("open-source software");
    expect(src).not.toContain("RotatingText");
    expect(src).not.toContain("hero-switzerland-headline");
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
    expect(HERO_PRODUCTS_CTA_DESCRIPTION).toBe(
      "Inspect the source and verify our claims."
    );
    expect(HERO_PRODUCTS_CTA_DESCRIPTION).not.toMatch(EMOJI_PATTERN);
  });

  it("server-renders hero copy with a Store products CTA", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);
    const hrefs = [...html.matchAll(/\bhref="([^"]*)"/g)].map(
      (match) => match[1]
    );

    expect(html).toMatch(/<h1[^>]*>open-source software<\/h1>/);
    expect(html).toContain("made in");
    expect(html).toContain("switzerland");
    expect(html).not.toContain("Open-source Software");
    expect(html).not.toContain("Made in");
    expect(html).toContain("text-brand-swiss-red");
    expect(html).not.toContain("Designed in Basel");
    expect(html).not.toContain("Engineered in Zürich");
    expect(html).not.toContain("RotatingText");
    expect(html).not.toContain("Made in Wallis");
    expect(html).not.toContain("Engineered, designed and made in Switzerland.");
    expect(html).toContain("private · simple · clean");
    expect(html).not.toContain("private, simple, clean");
    expect(html).not.toContain(
      "Our products are open source so you can verify our claims."
    );
    expect(html).not.toContain("browser tools, extensions");
    expect(html).not.toContain("<canvas");
    expect(html).toContain("bg-background");
    expect(html).not.toContain("radial-gradient");
    expect(html).toContain("justify-center");
    expect(html).toContain("gap-12");
    expect(html).toContain("sm:gap-16");
    expect(html).toContain("max-w-md");
    expect(html).toContain("text-center");
    expect(html).not.toContain("sm:text-left");
    expect(html).toContain("hero-enter-brand");
    expect(html).toContain("hero-enter-ctas");
    expect(html).toContain("Browse products");
    expect(html).toContain(HERO_PRODUCTS_CTA_DESCRIPTION);
    expect(html).not.toContain("Helvety Cloud");
    expect(html).not.toContain("Browse other products");
    expect(html).not.toContain("Microsoft 365");
    expect(html).not.toContain("M365");
    expect(html).not.toContain("End-to-end encrypted open-space workspace");
    expect(html).not.toContain("Free browser tools and Microsoft 365 apps");
    expect(hrefs).toContain("/store/products");
    expect(hrefs).not.toContain("/store");
    expect(hrefs).not.toContain("https://helvety.cloud");
    expect(html).not.toMatch(EMOJI_PATTERN);
  });

  it("links Store via urls.storeProducts", () => {
    const src = readFileSync(shellPath, "utf8");
    expect(src).toContain("urls.storeProducts");
    expect(src).not.toContain("urls.cloud");
    expect(src).not.toContain("getLocalAppHref(urls.store)");
  });
});
