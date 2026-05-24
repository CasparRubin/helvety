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

/** Slice bridge CSS from a layer comment through the next layer (or EOF). */
function extractLayerSection(css: string, layerHeading: string): string {
  const start = css.indexOf(layerHeading);
  expect(start, `missing ${layerHeading}`).toBeGreaterThanOrEqual(0);
  const nextLayer = css.indexOf("/* --- Layer ", start + layerHeading.length);
  return nextLayer === -1 ? css.slice(start) : css.slice(start, nextLayer);
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
      /\.ep-root[\s\S]*\.bg-white:not\(\[data-testid="title-bar"\]\):not\(\[data-testid="editor-toolbar"\]\)[\s\S]*background-color:\s*hsl\(var\(--card\)\)/
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

  it("bridge hides Eigenpal title-bar logo column and Help menu only", () => {
    const layer5 = extractLayerSection(bridge, "Layer 5: Eigenpal title-bar");

    expect(layer5).toContain('[data-testid="title-bar"] > div:first-child');
    expect(layer5).toContain(
      '[data-testid="title-bar"] [role="menubar"] > :last-child'
    );
    expect(layer5).not.toContain(".flex.items-center.px-1 > :last-child");
    expect(layer5).toMatch(
      /\[data-testid="title-bar"\] > div:first-child[\s\S]*display:\s*none\s*!important/
    );
    expect(layer5).toMatch(
      /\[role="menubar"\] > :last-child[\s\S]*display:\s*none\s*!important/
    );
  });

  it("bridge remaps chrome surfaces and inline white panels to semantic tokens", () => {
    const layer4 = extractLayerSection(
      bridge,
      "Layer 4: theme-agnostic chrome"
    );

    expect(layer4).toContain('[data-testid="formatting-bar"]');
    expect(layer4).toMatch(
      /\[data-testid="formatting-bar"\][\s\S]*--surface-toolbar\)/
    );
    expect(layer4).toMatch(
      /\.bg-white:not\(\[data-testid="title-bar"\]\):not\(\[data-testid="editor-toolbar"\]\)[\s\S]*--card\)/
    );
    expect(layer4).toContain('div[style*="background-color: white"]');
    expect(layer4).toMatch(
      /background-color:\s*hsl\(var\(--popover\)\)\s*!important/
    );
    expect(layer4).toMatch(
      /color:\s*hsl\(var\(--popover-foreground\)\)\s*!important/
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
    expect(readme).toMatch(/\*\*Format\*\* and \*\*Insert\*\*/);
    expect(readme).toMatch(/no \*\*comment\*\* UI/i);
    expect(readme).toMatch(/seamless stack/i);
    expect(readme).toMatch(/Layer 8/);
    expect(readme).toMatch(
      /toolbar hovers readable|no white panels with light-grey text/i
    );
    expect(readme).toMatch(/light and dark/i);
    expect(readme).not.toMatch(/Layers 4–7/);
    expect(llms).toMatch(/## User Interface/);
    expect(llms).toMatch(/light and dark mode/i);
    expect(llms).toMatch(/pinned command bar/i);
    expect(llms).toMatch(/Format and Insert/i);
    expect(llms).toMatch(/Help menu are hidden/i);
    expect(llms).toMatch(/printable document page stays white/i);
  });

  it("bridge defines expected integration layers", () => {
    expect(bridge).toMatch(/Layer 1: semantic shadcn variables \(light\)/);
    expect(bridge).toMatch(/Layer 2: document paper/);
    expect(bridge).toMatch(/Layer 3: remap eigenpal hardcoded slate/);
    expect(bridge).toMatch(/Layer 4: theme-agnostic chrome surfaces/);
    expect(bridge).toMatch(/Layer 5: Eigenpal title-bar chrome hides/);
    expect(bridge).toMatch(/Layer 6: comment suppression/);
    expect(bridge).toMatch(/Layer 7: seamless toolbar stack/);
    expect(bridge).toMatch(/Layer 8: overlay parity/);
  });

  it("bridge suppresses comment UI", () => {
    expect(bridge).toContain(".docx-comments-sidebar");
    expect(bridge).toContain('[data-action="addComment"]');
    expect(bridge).toContain('button[title="Add comment"]');
  });

  it("formatting bar pill uses surface-toolbar in light and dark", () => {
    const pillBlock = extractCssBlock(bridge, ".ep-root .bg-\\[\\#f1f5f9\\]");
    expect(pillBlock).toContain("hsl(var(--surface-toolbar))");
    expect(pillBlock).not.toContain("hsl(var(--muted))");
  });

  it("Layer 7 aligns toolbar stack with command bar (padding, borders, no shadow)", () => {
    const layer7 = extractLayerSection(
      bridge,
      "Layer 7: seamless toolbar stack"
    );

    const titleBar = extractCssBlock(layer7, '[data-testid="title-bar"]');
    expect(titleBar).toContain("padding-left: 1rem !important");
    expect(titleBar).toContain("padding-right: 1rem !important");
    expect(titleBar).toContain("padding-top: 0 !important");
    expect(titleBar).toContain("min-height: 3rem");

    const editorToolbar = extractCssBlock(
      layer7,
      '[data-testid="editor-toolbar"]'
    );
    expect(editorToolbar).toContain("border-top: none");
    expect(editorToolbar).toContain("box-shadow: none !important");
    expect(editorToolbar).toContain(
      "border-left: 1px solid hsl(var(--border))"
    );
    expect(editorToolbar).toContain(
      "border-right: 1px solid hsl(var(--border))"
    );

    const formattingBar = extractCssBlock(
      layer7,
      '[data-testid="formatting-bar"]'
    );
    expect(formattingBar).toContain("margin: 0 !important");
    expect(formattingBar).toContain("padding-left: 1rem !important");
    expect(formattingBar).toContain("border-radius: 0 !important");
    expect(formattingBar).toContain("hsl(var(--surface-toolbar))");
  });

  it("Layer 8 remaps tooltips and menu hovers for light and dark", () => {
    const layer8 = extractLayerSection(bridge, "Layer 8: overlay parity");
    const tooltipIdx = layer8.indexOf(
      ".ep-root .fixed.z-50.bg-slate-900.text-white"
    );
    const lightHoverIdx = layer8.indexOf("Light toolbar / menu hovers");

    expect(tooltipIdx).toBeGreaterThanOrEqual(0);
    expect(lightHoverIdx).toBeGreaterThan(tooltipIdx);
    expect(layer8).toMatch(
      /\.ep-root \.fixed\.z-50\.bg-slate-900\.text-white[\s\S]*--popover\)/
    );
    expect(layer8).toMatch(
      /\.ep-root \.fixed\.z-50\.bg-slate-900\.text-white[\s\S]*--popover-foreground\)/
    );
    expect(layer8).toMatch(
      /\.ep-root \[role="menuitem"\]:hover[\s\S]*background-color:\s*hsl\(var\(--accent\)\)/
    );
    expect(layer8).toMatch(
      /\.ep-root \[data-testid="editor-toolbar"\] \.hover\\:bg-slate-50:hover/
    );
    expect(layer8).not.toContain("html.dark .ep-root [data-testid=");
  });

  it("Layer 3 dark toolbar and menu hovers use accent pair", () => {
    const layer3 = extractLayerSection(
      bridge,
      "Layer 3: remap eigenpal hardcoded slate"
    );

    expect(layer3).toContain(
      'html.dark .ep-root [data-testid="editor-toolbar"] .hover\\:bg-slate-50:hover'
    );
    expect(layer3).toMatch(
      /html\.dark \.ep-root \[role="menuitem"\]:hover[\s\S]*background-color:\s*hsl\(var\(--accent\)\)/
    );
  });

  it("toolbar chrome uses square corners including formatting bar", () => {
    expect(bridge).toMatch(
      /\.ep-root \.rounded,[\s\S]*\.ep-root \[data-testid="formatting-bar"\][\s\S]*border-radius:\s*0;/
    );
    const layer7 = extractLayerSection(
      bridge,
      "Layer 7: seamless toolbar stack"
    );
    expect(extractCssBlock(layer7, '[data-testid="formatting-bar"]')).toContain(
      "border-radius: 0 !important"
    );
  });

  it(".ep-root light block exposes surface-toolbar token for command bar parity", () => {
    const lightVars = parseCssCustomProperties(
      extractCssBlock(bridge, ".ep-root")
    );
    expect(lightVars.get("surface-toolbar")).toBe(
      EP_EDITOR_THEME_LIGHT.surfaceToolbar
    );
  });
});
