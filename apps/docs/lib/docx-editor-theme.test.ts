import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  EP_DOC_BRAND_DARK,
  EP_DOC_BRAND_LIGHT,
  EP_DOC_CHROME_SEMANTIC,
  EP_DOC_PAPER,
  EP_EDITOR_THEME_DARK,
  EP_EDITOR_THEME_LIGHT,
} from "./docx-editor-theme-tokens";

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, "../app");
const stylesDir = join(libDir, "../styles");
const readmePath = join(libDir, "../README.md");

const globalsPath = join(appDir, "globals.css");
const bridgePath = join(stylesDir, "docx-editor-helvety-bridge.css");
const eigenpalStylesPath = join(
  libDir,
  "../node_modules/@eigenpal/docx-editor-react/dist/styles.css"
);

/** camelCase token key → CSS custom property name (`cardForeground` → `card-foreground`). */
function epThemeKeyToCssVar(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/** `textMuted` → `doc-text-muted`. */
function epDocKeyToCssVar(key: string): string {
  return `doc-${epThemeKeyToCssVar(key)}`;
}

/** Extract the body of the first `selector { ... }` block in CSS. */
function extractCssBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  expect(match, `missing CSS block for ${selector}`).not.toBeNull();
  return match![1]!;
}

/** Parse `--name: value;` declarations inside a rule body. */
function parseCssCustomProperties(block: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    vars.set(m[1]!, m[2]!.trim());
  }
  return vars;
}

/** Assert parsed CSS custom properties match a theme token record. */
function expectThemeBlock(
  vars: Map<string, string>,
  theme: Record<string, string>,
  options?: { expectRadius?: boolean }
): void {
  for (const [key, value] of Object.entries(theme)) {
    if (key === "radius") {
      if (options?.expectRadius) {
        expect(vars.get("radius")).toBe("0");
      }
      continue;
    }
    expect(vars.get(epThemeKeyToCssVar(key))).toBe(value);
  }
}

/** Assert `--doc-*` variables match a doc token record. */
function expectDocVars(
  vars: Map<string, string>,
  docTokens: Record<string, string>
): void {
  for (const [key, value] of Object.entries(docTokens)) {
    expect(vars.get(epDocKeyToCssVar(key))).toBe(value);
  }
}

describe("docx editor Helvety theme bridge", () => {
  const bridge = readFileSync(bridgePath, "utf8");
  const globals = readFileSync(globalsPath, "utf8");

  it("globals.css imports shared UI, eigenpal, then bridge (no local .ep-root rules)", () => {
    expect(globals).toContain('@import "@helvety/ui/globals.css"');
    expect(globals).toContain(
      '@import "@eigenpal/docx-editor-react/styles.css"'
    );
    expect(globals).toContain("docx-editor-helvety-bridge.css");
    expect(globals.indexOf("@helvety/ui/globals.css")).toBeLessThan(
      globals.indexOf("@eigenpal/docx-editor-react/styles.css")
    );
    expect(
      globals.indexOf("@eigenpal/docx-editor-react/styles.css")
    ).toBeLessThan(globals.indexOf("docx-editor-helvety-bridge.css"));
    expect(globals).not.toMatch(/\.ep-root\s*\{/);
  });

  it(".ep-root light block matches EP_EDITOR_THEME_LIGHT and semantic doc chrome", () => {
    const vars = parseCssCustomProperties(extractCssBlock(bridge, ".ep-root"));
    expectThemeBlock(vars, EP_EDITOR_THEME_LIGHT, { expectRadius: true });
    expectDocVars(vars, EP_DOC_CHROME_SEMANTIC);
    expectDocVars(vars, EP_DOC_BRAND_LIGHT);
    expect(vars.get("doc-hover")).toBe(EP_DOC_CHROME_SEMANTIC.hover);
    expect(vars.get("doc-link")).toBe(EP_DOC_BRAND_LIGHT.link);
  });

  it("html.dark .ep-root block matches EP_EDITOR_THEME_DARK and dark brand overrides only", () => {
    const vars = parseCssCustomProperties(
      extractCssBlock(bridge, "html.dark .ep-root")
    );
    expectThemeBlock(vars, EP_EDITOR_THEME_DARK, { expectRadius: false });
    expectDocVars(vars, EP_DOC_BRAND_DARK);
    expect(vars.get("doc-bg")).toBeUndefined();
    expect(vars.get("doc-text")).toBeUndefined();
    const darkBlock = extractCssBlock(bridge, "html.dark .ep-root");
    expect(darkBlock).not.toMatch(/#e8eaed|#3c4043|#1c1816/);
  });

  it("token module documents semantic chrome aliases (no legacy surround/chrome hex exports)", () => {
    const tokens = readFileSync(
      join(libDir, "docx-editor-theme-tokens.ts"),
      "utf8"
    );
    expect(tokens).toContain("EP_DOC_CHROME_SEMANTIC");
    expect(tokens).not.toContain("EP_DOC_SURROUND");
    expect(tokens).not.toContain("EP_DOC_CHROME_DARK");
  });

  it("chrome bg-white remap is theme-agnostic (not dark-only)", () => {
    expect(bridge).toMatch(
      /\.ep-root \.bg-white\s*\{[\s\S]*background-color:\s*hsl\(var\(--card\)\)/
    );
    expect(bridge).not.toMatch(/html\.dark \.ep-root \.bg-white\s*\{/);
  });

  it(".layout-page resets paper tokens for export fidelity", () => {
    const block = extractCssBlock(bridge, ".ep-root .layout-page");
    expect(block).toContain(`background-color: ${EP_DOC_PAPER.background}`);
    expect(block).toContain(`color: ${EP_DOC_PAPER.text}`);
    const paperDocVars = Object.fromEntries(
      Object.entries(EP_DOC_PAPER).filter(([key]) => key !== "background")
    ) as Omit<typeof EP_DOC_PAPER, "background">;
    expectDocVars(parseCssCustomProperties(block), paperDocVars);
  });

  it("page surfaces stay white in both themes", () => {
    expect(bridge).toMatch(
      /\.ep-root \.layout-page-content[\s\S]*background-color:\s*#ffffff/
    );
    expect(bridge).toContain(".ep-root .layout-page .bg-white");
  });

  it("themes global eigenpal hover rules under .ep-root with semantic muted", () => {
    expect(bridge).toContain(
      "html.dark .ep-root .docx-outline-heading-btn:hover"
    );
    expect(bridge).toContain(
      "html.dark .ep-root .ep-hyperlink-popup__icon-btn:hover"
    );
    expect(bridge).toContain("background-color: hsl(var(--muted)) !important");
    expect(bridge).not.toContain("#3c3836");
  });

  it("bridge hides Eigenpal title-bar logo column and Help menu", () => {
    expect(bridge).toContain('[data-testid="title-bar"] > div:first-child');
    expect(bridge).toContain(
      '[data-testid="title-bar"] .flex.items-center.px-1 > :last-child'
    );
    expect(bridge).toMatch(
      /\[data-testid="title-bar"\] > div:first-child[\s\S]*display:\s*none/
    );
    expect(bridge).toMatch(
      /\[data-testid="title-bar"\] \.flex\.items-center\.px-1 > :last-child[\s\S]*display:\s*none/
    );
  });

  it("bridge remaps chrome surfaces and inline white panels to semantic tokens", () => {
    expect(bridge).toContain('[data-testid="editor-toolbar"]');
    expect(bridge).toMatch(
      /\.ep-root \.bg-white\s*\{[\s\S]*background-color:\s*hsl\(var\(--card\)\)/
    );
    expect(bridge).toContain('div[style*="background-color: white"]');
    expect(bridge).toMatch(
      /background-color:\s*hsl\(var\(--popover\)\)\s*!important/
    );
  });

  it("eigenpal slate utilities in vendor CSS are covered by dark remaps", () => {
    const vendor = readFileSync(eigenpalStylesPath, "utf8");
    const slateUtilities = [
      ...new Set(
        [
          ...vendor.matchAll(
            /\.ep-root\s+(\.[\w\\:/\[\]#-]*slate[\w\\:/\[\]#-]*)/g
          ),
        ].map((m) => m[1]!)
      ),
    ];

    expect(slateUtilities.length).toBeGreaterThan(0);

    for (const utility of slateUtilities) {
      const darkSelector = `html.dark .ep-root ${utility}`;
      const hasDarkRule =
        bridge.includes(darkSelector) ||
        bridge.includes(`${darkSelector}:`) ||
        bridge.includes(`${darkSelector},`);
      expect(
        hasDarkRule,
        `add dark remap for eigenpal utility ${utility}`
      ).toBe(true);
    }
  });

  it("README and llms.txt document theme bridge and user-visible behavior", () => {
    const readme = readFileSync(readmePath, "utf8");
    const llms = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../public/llms.txt"),
      "utf8"
    );

    expect(readme).toContain("docx-editor-helvety-bridge.css");
    expect(readme).toContain("docx-editor-theme-tokens.ts");
    expect(readme).toMatch(/Eigenpal upgrade checklist/i);
    expect(readme).toMatch(/white page|white paper/i);
    expect(readme).toMatch(/no default doc icon column/i);
    expect(readme).toMatch(/no \*\*Help\*\* menu/i);
    expect(readme).toMatch(
      /readable contrast in dark mode \(no white panels with light-grey text\)/i
    );
    expect(llms).toMatch(/## User Interface/);
    expect(llms).toMatch(/light and dark mode/i);
    expect(llms).toMatch(/pinned command bar/i);
    expect(llms).toMatch(/Help menu are hidden/i);
    expect(llms).toMatch(/printable document page stays white/i);
  });

  it("bridge defines expected integration layers", () => {
    expect(bridge).toMatch(/Layer 1: semantic shadcn variables \(light\)/);
    expect(bridge).toMatch(/Layer 2: document paper/);
    expect(bridge).toMatch(/Layer 3: remap eigenpal hardcoded slate/);
    expect(bridge).toMatch(/Layer 4: theme-agnostic chrome surfaces/);
    expect(bridge).toMatch(/Layer 5: Eigenpal title-bar chrome hides/);
  });
});
