import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, "..");
const docsRequire = createRequire(join(appDir, "package.json"));

/** Walk up from a resolved entry to the package root (exports may hide package.json). */
function resolvePackageRoot(entryPath: string, expectedName: string): string {
  let packageDir = dirname(entryPath);
  while (packageDir !== dirname(packageDir)) {
    const manifestPath = join(packageDir, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        name?: string;
      };
      if (manifest.name === expectedName) {
        return packageDir;
      }
    }
    packageDir = dirname(packageDir);
  }
  throw new Error(`Could not resolve package root for ${expectedName}`);
}

/** Returns true when resolved semver satisfies a caret pin (^x.y.z). */
function satisfiesCaretPin(
  declaredPin: string,
  resolvedVersion: string
): boolean {
  const minVersion = declaredPin.replace(/^\^/, "");
  const minParts = minVersion.split(".").map(Number);
  const resolvedParts = resolvedVersion.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const minPart = minParts[index] ?? 0;
    const resolvedPart = resolvedParts[index] ?? 0;
    if (resolvedPart > minPart) return true;
    if (resolvedPart < minPart) return false;
  }
  return true;
}

describe("docx editor eigenpal vendor version", () => {
  it("installed eigenpal satisfies package.json pin and README documents it", () => {
    const pkg = JSON.parse(
      readFileSync(join(appDir, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
    };
    const declared = pkg.dependencies?.["@eigenpal/docx-editor-react"];
    expect(declared).toBeTruthy();

    const eigenpalRoot = resolvePackageRoot(
      docsRequire.resolve("@eigenpal/docx-editor-react"),
      "@eigenpal/docx-editor-react"
    );
    const resolved = JSON.parse(
      readFileSync(join(eigenpalRoot, "package.json"), "utf8")
    ) as { version: string };

    expect(satisfiesCaretPin(declared!, resolved.version)).toBe(true);

    const readme = readFileSync(join(appDir, "README.md"), "utf8");
    expect(readme).toContain(
      `current pin: \`${declared}\` in \`package.json\``
    );
  });

  it("vendor styles.css is present for theme bridge assertions", () => {
    const stylesPath = join(
      dirname(docsRequire.resolve("@eigenpal/docx-editor-react")),
      "styles.css"
    );
    const vendor = readFileSync(stylesPath, "utf8");
    expect(vendor).toContain(".ep-root");
    expect(vendor).toMatch(/--background:/);
  });
});
