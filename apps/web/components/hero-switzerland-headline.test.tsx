import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  HERO_SWITZERLAND_ROTATING_TEXTS,
  HERO_SWITZERLAND_STATIC_LINE,
  HeroSwitzerlandHeadline,
} from "./hero-switzerland-headline";

const mocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
  RotatingText: vi.fn(({ texts }: { texts: string[] }) => (
    <span data-testid="rotating">{texts[0]}</span>
  )),
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => mocks.useReducedMotion(),
}));

vi.mock("@/components/vendor/RotatingText", () => ({
  default: mocks.RotatingText,
}));

describe("HeroSwitzerlandHeadline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useReducedMotion.mockReturnValue(false);
  });

  it("cycles lead-in phrases via RotatingText with static red Switzerland", () => {
    const html = renderToStaticMarkup(<HeroSwitzerlandHeadline />);

    expect(html).toContain("Designed in Basel,");
    expect(html).toContain(HELVETY_SWISS_ORIGIN_COUNTRY);
    expect(html).toContain("text-brand-swiss-red");
    expect(html).toContain('data-testid="rotating"');
    expect(mocks.RotatingText).toHaveBeenCalledWith(
      expect.objectContaining({
        texts: [...HERO_SWITZERLAND_ROTATING_TEXTS],
        staggerDuration: 0.025,
        staggerFrom: "first",
        rotationInterval: 4000,
      }),
      undefined
    );
  });

  it("falls back to the static Switzerland line when motion is reduced", () => {
    mocks.useReducedMotion.mockReturnValue(true);

    const html = renderToStaticMarkup(<HeroSwitzerlandHeadline />);

    expect(html).toContain(
      "Designed in Basel, engineered in Zürich &amp; made in"
    );
    expect(html).toContain(HELVETY_SWISS_ORIGIN_COUNTRY);
    expect(html).toContain("text-brand-swiss-red");
    expect(mocks.RotatingText).not.toHaveBeenCalled();
    expect(HERO_SWITZERLAND_STATIC_LINE).toBe(
      `Designed in Basel, engineered in Zürich & made in ${HELVETY_SWISS_ORIGIN_COUNTRY}`
    );
  });
});
