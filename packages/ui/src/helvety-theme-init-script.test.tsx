import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HelvetyThemeInitScript } from "./helvety-theme-init-script";

describe("HelvetyThemeInitScript", () => {
  it("renders blocking script with nonce and shared init body for head placement", () => {
    const html = renderToStaticMarkup(
      <HelvetyThemeInitScript nonce="test-nonce" />
    );

    expect(html).toMatch(/^<script\b/);
    expect(html).toContain('nonce="test-nonce"');
    expect(html).toContain(getHelvetyThemeInitScript());
    expect(html).toContain('classList.add("dark")');
  });
});
