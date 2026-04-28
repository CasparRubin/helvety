import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("tasks SEO routes", () => {
  it("returns private robots output", () => {
    const robotsOutput = robots();

    expect(robotsOutput.rules).toEqual({
      userAgent: "*",
      disallow: "/",
    });
    expect(robotsOutput.sitemap).toBeUndefined();
  });

  it("returns an empty private sitemap", () => {
    expect(sitemap()).toEqual([]);
  });
});
