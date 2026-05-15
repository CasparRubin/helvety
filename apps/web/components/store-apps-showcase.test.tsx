import { getLocalAppHref, urls } from "@helvety/shared/config";
import { HELVETY_OPEN_SOURCE_BADGE_LABEL } from "@helvety/shared/licensing";
import { getStoreCatalogNewestFirst } from "@helvety/shared/store-catalog";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { StoreAppsShowcase } from "./store-apps-showcase";

import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("StoreAppsShowcase", () => {
  const products = getStoreCatalogNewestFirst();
  const expectedFreeCount = products.filter((p) => p.isFree).length;
  const expectedOpenSourceCount = products.filter((p) => p.isOpenSource).length;

  it("renders the section, one detail link per catalog product (newest-first hrefs)", () => {
    const html = renderToStaticMarkup(<StoreAppsShowcase />);

    expect(html).toContain('aria-label="Helvety products"');

    expect(products.length).toBeGreaterThan(0);
    const moreDetailsMatches = html.match(/>More details</g) ?? [];
    expect(moreDetailsMatches.length).toBe(products.length);

    for (const product of products) {
      const expected = getLocalAppHref(
        `${urls.store}/products/${product.slug}`
      );
      expect(html).toContain(expected);
    }
  });

  it("renders Free and AGPL badges in line with catalog flags", () => {
    const html = renderToStaticMarkup(<StoreAppsShowcase />);

    const freeMatches = html.match(/>Free</g) ?? [];
    const agplMatches =
      html.match(
        new RegExp(
          `>${HELVETY_OPEN_SOURCE_BADGE_LABEL.replace(".", "\\.")}<`,
          "g"
        )
      ) ?? [];
    expect(freeMatches.length).toBe(expectedFreeCount);
    expect(agplMatches.length).toBe(expectedOpenSourceCount);
  });
});
