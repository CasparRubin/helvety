import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("pdf SEO routes", () => {
  it("returns crawlable robots with expected disallow rules", () => {
    const robotsOutput = robots();
    const rules = Array.isArray(robotsOutput.rules)
      ? robotsOutput.rules[0]
      : robotsOutput.rules;
    const disallow = rules?.disallow;
    const disallowPaths = Array.isArray(disallow)
      ? disallow
      : disallow
        ? [disallow]
        : [];

    expect(rules?.allow).toBe("/");
    expect(disallowPaths).toEqual(expect.arrayContaining(["/api", "/auth"]));
    expect(disallowPaths).not.toContain("/pdf");
    expect(disallowPaths).not.toContain("/pdf/sitemap.xml");
    expect(robotsOutput.sitemap).toBe(`${urls.home}/pdf/sitemap.xml`);
  });

  it("returns canonical sitemap entries", () => {
    const entries = sitemap();
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: urls.pdf }),
        expect.objectContaining({ url: `${urls.pdf}/llms.txt` }),
      ])
    );
  });
});
