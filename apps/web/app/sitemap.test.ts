import { urls } from "@helvety/shared/config";
import { assertValidPublicSitemapEntries } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("web sitemap", () => {
  it("returns canonical public pages with metadata", () => {
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        urls.home,
        `${urls.home}/impressum`,
        `${urls.home}/privacy`,
        `${urls.home}/terms`,
        `${urls.home}/briefings`,
        `${urls.home}/briefings/energy-based-reasoners-duke-uiuc-harvard-reports-1-8-million-parameters-99-9-percent-sudoku-extreme-345-times-less-inference-compute`,
      ])
    );
    expect(entries).toHaveLength(6);
    assertValidPublicSitemapEntries(entries);
  });
});
