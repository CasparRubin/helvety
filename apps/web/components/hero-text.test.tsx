import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  HeroSoftwareProducts,
  HeroSwitzerland,
  HeroTagline,
} from "./hero-text";

const mocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
  isDark: true,
  Shuffle: vi.fn(({ text }: { text: string }) => (
    <p data-testid="shuffle">{text}</p>
  )),
  ShinyText: vi.fn(({ text }: { text: string }) => (
    <span data-testid="shiny">{text}</span>
  )),
}));

vi.mock("@helvety/ui/use-html-dark-theme", () => ({
  useHtmlDarkTheme: () => mocks.isDark,
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => mocks.useReducedMotion(),
}));

vi.mock("@/components/vendor/ShinyText", () => ({
  default: mocks.ShinyText,
}));

vi.mock("@/components/vendor/Shuffle", () => ({
  default: mocks.Shuffle,
}));

describe("hero-text", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useReducedMotion.mockReturnValue(false);
    mocks.isDark = true;
  });

  describe("animated motion", () => {
    it("renders copy via React Bits presets", () => {
      const html = renderToStaticMarkup(
        <>
          <HeroSoftwareProducts />
          <HeroSwitzerland />
          <HeroTagline />
        </>
      );

      expect(html).toContain("Software products");
      expect(html).toContain("Switzerland");
      expect(html).toContain('class="font-medium text-[#FF0000]"');
      expect(html).toContain("private · simple · clean");
      expect(html).toContain('data-testid="shuffle"');
      expect(html).toContain('data-testid="shiny"');
    });

    it("passes Helvety Shuffle preset for the eyebrow", () => {
      renderToStaticMarkup(<HeroSoftwareProducts />);

      expect(mocks.Shuffle).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Software products",
          tag: "p",
          triggerOnHover: false,
          respectReducedMotion: true,
          threshold: 0.01,
          loop: true,
          loopDelay: 5,
          className: expect.stringContaining("uppercase"),
        }),
        undefined
      );
    });

    it("passes lighter Shiny Text preset inside a semantic tagline paragraph (dark)", () => {
      mocks.isDark = true;
      const html = renderToStaticMarkup(<HeroTagline />);

      expect(html).toContain('class="text-base tracking-[0.08em] md:text-lg"');
      expect(mocks.ShinyText).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "private · simple · clean",
          color: "rgba(255, 255, 255, 0.82)",
          shineColor: "#ffffff",
          speed: 2.4,
        }),
        undefined
      );
    });

    it("uses black Shiny Text colors in light mode", () => {
      mocks.isDark = false;
      renderToStaticMarkup(<HeroTagline />);

      expect(mocks.ShinyText).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "rgba(0, 0, 0, 0.82)",
          shineColor: "#000000",
        }),
        undefined
      );
    });
  });

  describe("reduced motion", () => {
    beforeEach(() => {
      mocks.useReducedMotion.mockReturnValue(true);
    });

    it("still mounts Shuffle with respectReducedMotion for the eyebrow", () => {
      const html = renderToStaticMarkup(<HeroSoftwareProducts />);

      expect(html).toContain("Software products");
      expect(mocks.Shuffle).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Software products",
          respectReducedMotion: true,
          loop: true,
          loopDelay: 5,
        }),
        undefined
      );
    });

    it("falls back to static Switzerland and lighter tagline without Shiny Text", () => {
      const html = renderToStaticMarkup(
        <>
          <HeroSwitzerland />
          <HeroTagline />
        </>
      );

      expect(html).toContain('class="font-medium text-[#FF0000]"');
      expect(html).toContain("Switzerland");
      expect(html).toContain("text-foreground/85");
      expect(html).toContain("private · simple · clean");
      expect(html).toContain("tracking-[0.08em]");
      expect(html).toContain("md:text-lg");
      expect(mocks.ShinyText).not.toHaveBeenCalled();
    });
  });
});
