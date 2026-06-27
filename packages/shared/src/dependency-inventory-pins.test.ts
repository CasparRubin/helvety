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

  it("drift map lucide-react pin matches packages/ui package.json", () => {
    const drift = readFileSync(
      join(repoRoot, "scripts/check-workspace-version-drift.mjs"),
      "utf8"
    );
    const uiPkg = readWorkspacePackage("packages/ui/package.json");
    const lucide = uiPkg.dependencies?.["lucide-react"];
    expect(lucide).toBeTruthy();
    expect(drift).toContain(`["lucide-react", "${lucide}"]`);
  });

  it("drift map tiptap pins match packages/ui package.json", () => {
    const drift = readFileSync(
      join(repoRoot, "scripts/check-workspace-version-drift.mjs"),
      "utf8"
    );
    const uiPkg = readWorkspacePackage("packages/ui/package.json");
    const tiptapPm = uiPkg.dependencies?.["@tiptap/pm"];
    const tiptapReact = uiPkg.dependencies?.["@tiptap/react"];
    expect(tiptapPm).toBeTruthy();
    expect(tiptapReact).toBeTruthy();
    expect(drift).toContain(`["@tiptap/pm", "${tiptapPm}"]`);
    expect(drift).toContain(`["@tiptap/react", "${tiptapReact}"]`);
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

    const ort = upscalerPkg.dependencies?.["onnxruntime-web"];
    const lucide = uiPkg.dependencies?.["lucide-react"];

    expect(audit).toMatch(/## Subsequent updates \(2026-06-22\)/);
    expect(ort).toBeTruthy();
    expect(lucide).toBeTruthy();
    expect(audit).toContain(ort);
    expect(audit).toContain(lucide);
    expect(audit).toContain("dependency-inventory.md");
  });
});
