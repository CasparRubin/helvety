import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HelvetyThemeInitScript } from "./helvety-theme-init-script";

describe("HelvetyThemeInitScript", () => {
  it("renders nonced theme init script with React 19-safe type toggle", () => {
    const html = renderToStaticMarkup(
      <HelvetyThemeInitScript nonce="test-nonce" />
    );

    expect(html).toMatch(/^<script\b/);
    expect(html).toContain('nonce="test-nonce"');
    expect(html).toContain(getHelvetyThemeInitScript());
    expect(html).toContain('classList.add("dark")');
    expect(html).toMatch(/type="(text\/javascript|text\/plain)"/);
  });
});
