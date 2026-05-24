import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EP_DOC_BRAND_DARK,
  EP_DOC_BRAND_LIGHT,
  EP_EDITOR_THEME_DARK,
  EP_EDITOR_THEME_LIGHT,
} from "./docx-editor-theme-tokens";

const bridgeCss = readFileSync(
  resolve(import.meta.dirname, "../styles/docx-editor-helvety-bridge.css"),
  "utf8"
);

/** Reads a `--name: value;` declaration from a CSS block. */
function extractCssVar(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`, "u"));
  return match?.[1]?.trim();
}

describe("docx-editor-helvety-bridge.css token sync", () => {
  it("maps light brand tokens from docx-editor-theme-tokens.ts", () => {
    const lightBlock = bridgeCss.slice(
      bridgeCss.indexOf(".ep-root {"),
      bridgeCss.indexOf("html.dark .ep-root")
    );

    expect(extractCssVar(lightBlock, "--doc-primary")).toBe(
      EP_DOC_BRAND_LIGHT.primary
    );
    expect(extractCssVar(lightBlock, "--doc-primary-hover")).toBe(
      EP_DOC_BRAND_LIGHT.primaryHover
    );
    expect(extractCssVar(lightBlock, "--background")).toBe(
      EP_EDITOR_THEME_LIGHT.background
    );
  });

  it("maps dark brand tokens from docx-editor-theme-tokens.ts", () => {
    const darkBlock = bridgeCss.slice(bridgeCss.indexOf("html.dark .ep-root"));

    expect(extractCssVar(darkBlock, "--doc-primary")).toBe(
      EP_DOC_BRAND_DARK.primary
    );
    expect(extractCssVar(darkBlock, "--doc-primary-hover")).toBe(
      EP_DOC_BRAND_DARK.primaryHover
    );
    expect(extractCssVar(darkBlock, "--background")).toBe(
      EP_EDITOR_THEME_DARK.background
    );
  });
});
