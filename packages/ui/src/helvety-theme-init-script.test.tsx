import { getHelvetyThemeInitScript } from "@helvety/shared/layout-primitives";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HelvetyThemeInitScript } from "./helvety-theme-init-script";

describe("HelvetyThemeInitScript", () => {
  it("renders the theme init script with a React 19-safe type toggle", () => {
    const html = renderToStaticMarkup(<HelvetyThemeInitScript />);

    expect(html).toMatch(/^<script\b/);
    expect(html).not.toContain("nonce=");
    expect(html).toContain(getHelvetyThemeInitScript());
    expect(html).toContain('classList.add("dark")');
    expect(html).toMatch(/type="(text\/javascript|text\/plain)"/);
  });
});
