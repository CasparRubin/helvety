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
  it("renders the section and newest-first store links", () => {
    const html = renderToStaticMarkup(<StoreAppsShowcase />);

    expect(html).toContain('aria-label="Helvety products"');
    expect(html).toContain("/store/products/helvety-image-upscaler");
    expect(html).toContain("/store/products/helvety-pdf");
    expect(html).toContain("More details");
  });

  it("renders Free and Open Source claim badges for current catalog", () => {
    const html = renderToStaticMarkup(<StoreAppsShowcase />);

    const freeMatches = html.match(/>Free</g) ?? [];
    const openSourceMatches = html.match(/>Open Source</g) ?? [];
    expect(freeMatches.length).toBe(8);
    expect(openSourceMatches.length).toBe(8);
  });
});
