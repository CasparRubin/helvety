import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads the shared dependency drift config consumed by the guardrail script. */
function parseDriftRequiredVersions(): Map<string, string> {
  const config = JSON.parse(
    readFileSync(
      join(repoRoot, "scripts/workspace-version-drift.config.json"),
      "utf8"
    )
  );
  const requiredVersionByDep = config.requiredVersionByDep as
    Record<string, string> | undefined;
  if (!requiredVersionByDep) {
    throw new Error("Could not parse requiredVersionByDep from drift config");
  }
  return new Map(Object.entries(requiredVersionByDep));
}

/** Minimal package.json shape for drift parity checks. */
type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** Reads a workspace package.json relative to the monorepo root. */
function readManifest(relativePath: string): PackageManifest {
  return JSON.parse(
    readFileSync(join(repoRoot, relativePath), "utf8")
  ) as PackageManifest;
}

/** Resolves a dependency version from any manifest dependency group. */
function getDeclaredVersion(
  manifest: PackageManifest,
  dependencyName: string
): string | undefined {
  return (
    manifest.dependencies?.[dependencyName] ??
    manifest.devDependencies?.[dependencyName] ??
    manifest.peerDependencies?.[dependencyName]
  );
}

/** Lists apps/* and packages/* package.json paths plus root. */
function listWorkspacePackageJsonPaths(): string[] {
  const paths = ["package.json"];
  for (const base of ["apps", "packages"] as const) {
    for (const entry of readdirSync(join(repoRoot, base), {
      withFileTypes: true,
    })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = `${base}/${entry.name}/package.json`;
      try {
        readFileSync(join(repoRoot, manifestPath));
        paths.push(manifestPath);
      } catch {
        // Skip workspace directories without a package.json.
      }
    }
  }
  return paths;
}

describe("workspace drift parity (package.json vs shared drift config)", () => {
  const required = parseDriftRequiredVersions();

  it("drift map includes required multi-workspace dependencies", () => {
    for (const dep of [
      "@base-ui/react",
      "lucide-react",
      "next",
      "react",
      "react-dom",
      "react-pdf",
      "canvas-size",
      "typescript",
      "tailwindcss",
      "@tailwindcss/postcss",
      "prettier-plugin-tailwindcss",
    ]) {
      expect(required.has(dep), `missing drift entry for ${dep}`).toBe(true);
    }
  });

  it("every declared shared dependency matches the drift map", () => {
    const mismatches: string[] = [];
    for (const relativePath of listWorkspacePackageJsonPaths()) {
      const manifest = readManifest(relativePath);
      for (const [dep, expected] of required) {
        const actual = getDeclaredVersion(manifest, dep);
        if (!actual) continue;
        if (actual !== expected) {
          mismatches.push(
            `${relativePath}: ${dep} is ${actual} (expected ${expected})`
          );
        }
      }
    }
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("all zone apps pin next and lucide-react identically", () => {
    const apps = listWorkspacePackageJsonPaths().filter((relativePath) =>
      relativePath.startsWith("apps/")
    );

    const nextPins = new Set<string>();
    const lucidePins = new Set<string>();
    for (const appPath of apps) {
      const manifest = readManifest(appPath);
      const next = manifest.dependencies?.next;
      const lucide = manifest.dependencies?.["lucide-react"];
      if (next) nextPins.add(next);
      if (lucide) lucidePins.add(lucide);
    }
    expect(nextPins.size).toBe(1);
    expect(lucidePins.size).toBe(1);
    expect([...nextPins][0]).toBe(required.get("next"));
    expect([...lucidePins][0]).toBe(required.get("lucide-react"));
  });

  it("does not declare removed editor dependencies", () => {
    const ui = readManifest("packages/ui/package.json");
    for (const dep of [
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@tiptap/pm",
      "@tiptap/react",
      "@tiptap/starter-kit",
    ] as const) {
      expect(getDeclaredVersion(ui, dep)).toBeUndefined();
    }
    expect(getDeclaredVersion(ui, "@base-ui/react")).toBe(
      required.get("@base-ui/react")
    );
  });
});

describe("security dependency floors script", () => {
  it("tracks canonical next and react minimums", () => {
    const source = readFileSync(
      join(repoRoot, "scripts/check-security-dependency-floors.mjs"),
      "utf8"
    );
    const required = parseDriftRequiredVersions();
    const minimum = (dependencyName: string): string => {
      const specifier = required.get(dependencyName);
      if (!specifier) {
        throw new Error(`Missing drift version for ${dependencyName}`);
      }
      return specifier.replace(/^[~^]/, "");
    };

    expect(source).toContain(`next: "${minimum("next")}"`);
    expect(source).toContain(`react: "${minimum("react")}"`);
    expect(source).not.toContain("@supabase/supabase-js");
    expect(source).not.toContain("@simplewebauthn/server");
  });
});

describe("dependency inventory doc pins", () => {
  const inventory = readFileSync(
    join(repoRoot, "docs/dependency-inventory.md"),
    "utf8"
  );

  it("lists current next and override pins", () => {
    const required = parseDriftRequiredVersions();
    const root = readManifest("package.json");

    expect(inventory).toContain(required.get("next"));
    expect(inventory).toContain(required.get("@base-ui/react"));
    expect(inventory).toContain(required.get("shadcn"));
    expect(inventory).toContain(`vite@${root.overrides?.vite}`);
    expect(inventory).toContain(`postcss@${root.overrides?.postcss}`);
    expect(inventory).toContain(
      `typescript-eslint@${root.overrides?.["typescript-eslint"]}`
    );
    expect(inventory).toContain(`hono@${root.overrides?.hono}`);
    expect(inventory).toContain(`nanoid@${root.overrides?.nanoid}`);
    expect(inventory).toContain(`undici@${root.overrides?.undici}`);
  });

  it("documents drift config JSON as the workspace specifier SSOT", () => {
    expect(inventory).toContain("workspace-version-drift.config.json");
  });
});

describe("shared PDF.js worker sync architecture", () => {
  it("zones re-export resolve and call shared syncPdfWorker", () => {
    for (const zone of ["pdf", "ocr"] as const) {
      const resolveWrapper = readFileSync(
        join(repoRoot, `apps/${zone}/scripts/resolve-pdfjs-for-react-pdf.mjs`),
        "utf8"
      );
      const syncWrapper = readFileSync(
        join(repoRoot, `apps/${zone}/scripts/sync-pdf-worker.mjs`),
        "utf8"
      );

      expect(resolveWrapper).toContain(
        'from "../../../scripts/resolve-pdfjs-for-react-pdf.mjs"'
      );
      expect(resolveWrapper).toContain("resolvePdfJsForReactPdf");
      expect(syncWrapper).toContain(
        'from "../../../scripts/sync-pdf-worker.mjs"'
      );
      expect(syncWrapper).toContain("syncPdfWorker");
    }
  });

  it("shared sync and resolve modules export the expected API", async () => {
    const { resolvePdfJsForReactPdf, PDFJS_SOURCE_LABEL } = await import(
      join(repoRoot, "scripts/resolve-pdfjs-for-react-pdf.mjs")
    );
    const { syncPdfWorker } = await import(
      join(repoRoot, "scripts/sync-pdf-worker.mjs")
    );

    expect(PDFJS_SOURCE_LABEL).toBe("react-pdf>pdfjs-dist");
    expect(typeof resolvePdfJsForReactPdf).toBe("function");
    expect(typeof syncPdfWorker).toBe("function");
  });
});
