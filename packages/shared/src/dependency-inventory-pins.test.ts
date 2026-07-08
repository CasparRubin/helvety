import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads JSON package.json from a workspace-relative path. */
function readWorkspacePackage(relativePath: string): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
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

  it("security audit subsequent-updates section reflects current extended pins", () => {
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

    expect(audit).toMatch(/### Dependency sweep \(2026-07-04\)/);
    expect(audit).toMatch(/## Subsequent updates \(2026-07-07\)/);
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
});
