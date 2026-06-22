import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(appDir, "../..");
const scriptPath = join(repoRoot, "scripts", "copy-ort-runtime.mjs");
const ortPublicDir = join(appDir, "public", "ort");

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

/** Runtime artifacts copied from onnxruntime-web dist. */
function listOrtDistRuntimeFiles(distDir: string): string[] {
  return readdirSync(distDir)
    .filter((name) => /\.(wasm|mjs)$/i.test(name))
    .sort();
}

describe("copy-ort-runtime script", () => {
  it("copies wasm and mjs runtime files from onnxruntime-web dist", () => {
    execFileSync(process.execPath, [scriptPath], { cwd: repoRoot });

    const require = createRequire(join(appDir, "package.json"));
    const ortPackageRoot = resolvePackageRoot(
      require.resolve("onnxruntime-web"),
      "onnxruntime-web"
    );
    const ortDistDir = join(ortPackageRoot, "dist");

    const expectedFiles = listOrtDistRuntimeFiles(ortDistDir);
    expect(expectedFiles.length).toBeGreaterThan(0);

    const copiedFiles = listOrtDistRuntimeFiles(ortPublicDir);
    expect(copiedFiles).toEqual(expectedFiles);

    for (const fileName of expectedFiles) {
      const source = readFileSync(join(ortDistDir, fileName));
      const copied = readFileSync(join(ortPublicDir, fileName));
      expect(copied.equals(source)).toBe(true);
      expect(copied.byteLength).toBeGreaterThan(0);
    }
  });

  it("package.json pins onnxruntime-web and wires predev/prebuild", () => {
    const pkg = JSON.parse(
      readFileSync(join(appDir, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(pkg.dependencies?.["onnxruntime-web"]).toMatch(/^\^1\.27/);
    expect(pkg.scripts?.predev).toContain("copy-ort-runtime.mjs");
    expect(pkg.scripts?.prebuild).toContain("copy-ort-runtime.mjs");
  });

  it("resolved onnxruntime-web version satisfies the declared pin", () => {
    const pkg = JSON.parse(
      readFileSync(join(appDir, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
    };
    const declared = pkg.dependencies?.["onnxruntime-web"];
    expect(declared).toBeTruthy();

    const require = createRequire(join(appDir, "package.json"));
    const ortPackageRoot = resolvePackageRoot(
      require.resolve("onnxruntime-web"),
      "onnxruntime-web"
    );
    const resolved = JSON.parse(
      readFileSync(join(ortPackageRoot, "package.json"), "utf8")
    ) as { version: string };

    const minVersion = declared!.replace(/^\^/, "");
    const [minMajor, minMinor] = minVersion.split(".").map(Number);
    const [resolvedMajor, resolvedMinor] = resolved.version
      .split(".")
      .map(Number);

    expect(resolvedMajor).toBeGreaterThanOrEqual(minMajor!);
    if (resolvedMajor === minMajor) {
      expect(resolvedMinor).toBeGreaterThanOrEqual(minMinor!);
    }
  });
});
