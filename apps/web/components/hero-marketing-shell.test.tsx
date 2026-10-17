import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { HELVETY_COMPANY_VALUES_TAGLINE } from "@helvety/shared/licensing";
import { POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL } from "@helvety/shared/power-platform-configurator-copy";
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
  });

  it("server-renders hero copy with a Store products CTA", () => {
    const html = renderToStaticMarkup(<HeroMarketingShell />);
    const hrefs = [...html.matchAll(/\bhref="([^"]*)"/g)].map(
      (match) => match[1]
    );

    expect(html).toMatch(/<h1[^>]*>open-source software<\/h1>/);
    expect(html).toContain("Made in");
    expect(html).toContain("Switzerland");
    expect(html).not.toContain("Open-source Software");
    expect(html).not.toContain("made in switzerland");
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
    expect(html).toContain("justify-center-safe");
    expect(html).toContain("gap-16");
    expect(html).toContain("sm:gap-16");
    expect(html).toContain("max-w-md");
    expect(html).toContain("text-center");
    expect(html).not.toContain("sm:text-left");
    expect(html).toContain("hero-enter-brand");
    expect(html).toContain("hero-enter-ctas");
    expect(html).toContain("View all products");
    expect(html).not.toContain("Inspect the source and verify our claims.");
    expect(html).not.toContain("Helvety Cloud");
    expect(html).not.toContain("Browse other products");
    expect(html).not.toContain("Microsoft 365");
    expect(html).not.toContain("M365");
    expect(html).not.toContain("End-to-end encrypted open-space workspace");
    expect(html).not.toContain("Free browser tools and Microsoft 365 apps");
    expect(html).toContain("Released Tools");
    expect(html.replaceAll("&#x27;", "'")).toContain("What we're working on");
    expect(html).toContain("Helvety PDF");
    expect(html).toContain("Helvety Image Editor");
    expect(html).toContain("Power Platform Configurator");
    expect(html).toContain("Merge, rotate, and edit PDF pages.");
    expect(html).toContain("Annotate, crop, and resize images.");
    expect(html).toContain("Tune Power Automate and Power Apps.");
    expect(html).toContain("Screenshots and Live Draw on Windows.");
    expect(html).toContain("Dataverse modules for Windows 11.");
    expect(html).not.toContain("Chrome Web Store");
    expect(html).toContain("Helvety Screen Tools");
    expect(html).toContain("Helvety Power Platform Tools");
    expect(html).not.toContain("Helvety OCR");
    expect(hrefs).toContain("/pdf");
    expect(hrefs).toContain("/image-editor");
    expect(hrefs).toContain(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL);
    expect(hrefs).toContain("/store/products/helvety-screen-tools");
    expect(hrefs).toContain("/store/products/helvety-power-platform-tools");
    expect(hrefs).toContain("/store/products");
    expect(hrefs).not.toContain("/store");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(hrefs).not.toContain("https://helvety.cloud");
    expect(html).not.toMatch(EMOJI_PATTERN);
  });

  it("links Store via urls.storeProducts", () => {
    const src = readFileSync(shellPath, "utf8");
    expect(src).toContain("urls.storeProducts");
    expect(src).toContain("urls.pdf");
    expect(src).toContain("urls.imageEditor");
    expect(src).toContain("POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL");
    expect(src).not.toContain("urls.cloud");
    expect(src).not.toContain("getLocalAppHref(urls.store)");
  });
});
