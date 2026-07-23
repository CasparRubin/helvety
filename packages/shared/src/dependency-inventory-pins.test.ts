import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads JSON package.json from a workspace-relative path. */
function readWorkspacePackage(relativePath: string): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
} {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    overrides?: Record<string, string>;
  };
}

/** Reads the canonical workspace version drift pin config. */
function readDriftConfig(): {
  requiredVersionByDep: Record<string, string>;
} {
  return JSON.parse(
    readFileSync(
      join(repoRoot, "scripts/workspace-version-drift.config.json"),
      "utf8"
    )
  ) as { requiredVersionByDep: Record<string, string> };
}

describe("extended dependency inventory pin parity", () => {
  const inventory = readFileSync(
    join(repoRoot, "docs/dependency-inventory.md"),
    "utf8"
  );

  it("dependency inventory documents OCR tessdata as uncompressed traineddata", () => {
    const ocrPkg = readWorkspacePackage("apps/ocr/package.json");
    const tesseract = ocrPkg.dependencies?.["tesseract.js"];
    expect(tesseract).toBeTruthy();
    expect(inventory).toContain("tesseract.js");
    expect(inventory).toContain("*.traineddata");
    expect(inventory).toContain("download:tessdata");
    expect(inventory).not.toContain("*.traineddata.gz");
  });

  it("image-upscaler ORT pin matches apps/image-upscaler/package.json and inventory table", () => {
    const upscalerPkg = readWorkspacePackage(
      "apps/image-upscaler/package.json"
    );
    const declared = upscalerPkg.dependencies?.["onnxruntime-web"];
    expect(declared).toBeTruthy();
    expect(inventory).toContain("onnxruntime-web");
    expect(inventory).toContain(
      `\`${declared}\` — \`apps/image-upscaler/package.json\``
    );
  });

  it("image-editor konva pin matches apps/image-editor/package.json and inventory table", () => {
    const editorPkg = readWorkspacePackage("apps/image-editor/package.json");
    const declared = editorPkg.dependencies?.konva;
    expect(declared).toBeTruthy();
    expect(inventory).toContain("konva");
    expect(inventory).toContain(
      `\`${declared}\` — \`apps/image-editor/package.json\``
    );
  });

  it("drift map lucide-react pin matches packages/ui package.json", () => {
    const driftConfig = readDriftConfig();
    const uiPkg = readWorkspacePackage("packages/ui/package.json");
    const lucide = uiPkg.dependencies?.["lucide-react"];
    expect(lucide).toBeTruthy();
    expect(driftConfig.requiredVersionByDep["lucide-react"]).toBe(lucide);
  });

  it("drift map tiptap pins match packages/ui package.json", () => {
    const driftConfig = readDriftConfig();
    const uiPkg = readWorkspacePackage("packages/ui/package.json");
    const tiptapPm = uiPkg.dependencies?.["@tiptap/pm"];
    const tiptapReact = uiPkg.dependencies?.["@tiptap/react"];
    expect(tiptapPm).toBeTruthy();
    expect(tiptapReact).toBeTruthy();
    expect(driftConfig.requiredVersionByDep["@tiptap/pm"]).toBe(tiptapPm);
    expect(driftConfig.requiredVersionByDep["@tiptap/react"]).toBe(tiptapReact);
  });

  it("security audit references canonical inventory and current extended pins", () => {
    const audit = readFileSync(
      join(repoRoot, "docs/security-audit-2026-06-13.md"),
      "utf8"
    );
    const upscalerPkg = readWorkspacePackage(
      "apps/image-upscaler/package.json"
    );
    const uiPkg = readWorkspacePackage("packages/ui/package.json");
    const devDepsPkg = readWorkspacePackage("packages/dev-deps/package.json");
    const editorPkg = readWorkspacePackage("apps/image-editor/package.json");

    const ort = upscalerPkg.dependencies?.["onnxruntime-web"];
    const lucide = uiPkg.dependencies?.["lucide-react"];
    const vitest = devDepsPkg.dependencies?.vitest;
    const konva = editorPkg.dependencies?.konva;

    expect(ort).toBeTruthy();
    expect(lucide).toBeTruthy();
    expect(vitest).toBeTruthy();
    expect(konva).toBeTruthy();
    expect(audit).toContain(ort);
    expect(audit).toContain(lucide);
    expect(audit).toContain(vitest);
    expect(audit).toContain(konva);
    expect(audit).toContain("dependency-inventory.md");
    expect(audit).not.toMatch(/\| Asset[^\n]+\| Current pin /);
  });

  it("packages/config eslint-config-next caret minimum matches next", () => {
    const configPkg = readWorkspacePackage("packages/config/package.json");
    const next = configPkg.dependencies?.next;
    const eslintConfigNext = configPkg.dependencies?.["eslint-config-next"];
    expect(next).toBeTruthy();
    expect(eslintConfigNext).toBeTruthy();
    expect(eslintConfigNext).toBe(next);
  });

  it("dev-deps README cites extension-chrome @types/chrome pin", () => {
    const devDepsReadme = readFileSync(
      join(repoRoot, "packages/dev-deps/README.md"),
      "utf8"
    );
    const extensionChrome = readWorkspacePackage(
      "packages/extension-chrome/package.json"
    );
    const typesChrome = extensionChrome.devDependencies?.["@types/chrome"];
    expect(typesChrome).toBeTruthy();
    expect(devDepsReadme).toContain("@types/chrome");
    expect(devDepsReadme).toContain(typesChrome);
  });

  it("dependency inventory documents live supabase drift and vite override pins", () => {
    const driftConfig = readDriftConfig();
    const root = readWorkspacePackage("package.json");
    const supabaseDrift =
      driftConfig.requiredVersionByDep["@supabase/supabase-js"];
    const viteOverride = root.overrides?.vite;

    expect(supabaseDrift).toBeTruthy();
    expect(viteOverride).toBeTruthy();
    expect(inventory).toContain(supabaseDrift);
    expect(inventory).toContain(`vite@${viteOverride}`);
    expect(inventory).toContain(
      `@types/node@${root.overrides?.["@types/node"]}`
    );
  });

  it("security audit points readers to dependency inventory for current pins", () => {
    const audit = readFileSync(
      join(repoRoot, "docs/security-audit-2026-06-13.md"),
      "utf8"
    );
    const driftConfig = readDriftConfig();
    const root = readWorkspacePackage("package.json");
    const supabaseOverride = root.overrides?.["@supabase/supabase-js"];
    const viteOverride = root.overrides?.vite;
    const latestUpdatesHeading = "## Subsequent updates (2026-07-23)";
    const latestUpdatesIndex = audit.indexOf(latestUpdatesHeading);
    expect(latestUpdatesIndex).toBeGreaterThan(-1);
    const latestUpdatesSection = audit.slice(latestUpdatesIndex);

    // Historical pass remains documented; latest section is the live pin trail.
    expect(audit).toMatch(/## Subsequent updates \(2026-07-16\)/);
    expect(latestUpdatesSection).toMatch(
      /dependency-inventory\.md.*current pins/i
    );
    expect(supabaseOverride).toBeTruthy();
    expect(viteOverride).toBeTruthy();
    expect(latestUpdatesSection).toContain(supabaseOverride);
    expect(latestUpdatesSection).toContain(
      driftConfig.requiredVersionByDep["lucide-react"]
    );
    expect(latestUpdatesSection).toContain(
      driftConfig.requiredVersionByDep.next
    );
    expect(latestUpdatesSection).toContain(`\`vite\` \`${viteOverride}\``);
  });

  it("security audit July stack table is labeled as a historical pass", () => {
    const audit = readFileSync(
      join(repoRoot, "docs/security-audit-2026-06-13.md"),
      "utf8"
    );
    const stackSection = audit.slice(
      audit.indexOf("### Stack / best-practices alignment")
    );

    expect(stackSection).toMatch(/July 2026 re-audit pass/i);
    expect(stackSection).toMatch(/at that time|snapshot/i);
    expect(stackSection).toMatch(
      /Subsequent updates \(2026-07-23\)|dependency-inventory\.md.*current pins/i
    );
  });

  it("dependency inventory documents Chromium extension external repo toolchain", () => {
    expect(inventory).toContain("helvety-browser-extension-chromium");
    expect(inventory).toContain("@helvety/config/tsconfig.extension.json");
    expect(inventory).toContain("createExtensionVitestConfig");
    expect(inventory).toContain("env.example");
    expect(inventory).toContain("VITE_HELVETY_AUTH_ORIGIN");
    expect(inventory).toContain("tests/dependency-pins.test.ts");
  });
});
