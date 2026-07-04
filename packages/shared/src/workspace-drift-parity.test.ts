import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Parses REQUIRED_VERSION_BY_DEP from the drift guardrail script. */
function parseDriftRequiredVersions(): Map<string, string> {
  const source = readFileSync(
    join(repoRoot, "scripts/check-workspace-version-drift.mjs"),
    "utf8"
  );
  const block = source.match(
    /REQUIRED_VERSION_BY_DEP = new Map\(\[([\s\S]*?)\]\);/
  );
  if (!block?.[1]) {
    throw new Error(
      "Could not parse REQUIRED_VERSION_BY_DEP from drift script"
    );
  }
  const map = new Map<string, string>();
  for (const match of block[1].matchAll(/\["([^"]+)",\s*"([^"]+)"\]/g)) {
    const dep = match[1];
    const version = match[2];
    if (dep && version) {
      map.set(dep, version);
    }
  }
  return map;
}

/** Minimal package.json shape for drift parity checks. */
type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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
      if (entry.isDirectory()) {
        paths.push(`${base}/${entry.name}/package.json`);
      }
    }
  }
  return paths;
}

describe("workspace drift parity (package.json vs REQUIRED_VERSION_BY_DEP)", () => {
  const required = parseDriftRequiredVersions();

  it("drift map includes expanded multi-workspace deps from 2026-07-04 sweep", () => {
    for (const dep of [
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-underline",
      "radix-ui",
    ]) {
      expect(required.has(dep), `missing drift entry for ${dep}`).toBe(true);
    }
    expect(required.get("next")).toBe("^16.2.10");
    expect(required.get("@supabase/supabase-js")).toBe("^2.110.0");
    expect(required.get("lucide-react")).toBe("^1.23.0");
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
    const apps = readdirSync(join(repoRoot, "apps"), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => `apps/${e.name}/package.json`);

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

  it("@dnd-kit pins match across E2EE apps and packages/ui", () => {
    const e2eeApps = [
      "apps/tasks/package.json",
      "apps/contacts/package.json",
      "apps/notes/package.json",
      "apps/links/package.json",
      "packages/ui/package.json",
    ];
    for (const dep of ["@dnd-kit/core", "@dnd-kit/sortable"] as const) {
      const expected = required.get(dep);
      for (const path of e2eeApps) {
        expect(getDeclaredVersion(readManifest(path), dep)).toBe(expected);
      }
    }
    const utilitiesExpected = required.get("@dnd-kit/utilities");
    for (const path of e2eeApps.slice(0, 4)) {
      expect(getDeclaredVersion(readManifest(path), "@dnd-kit/utilities")).toBe(
        utilitiesExpected
      );
    }
  });

  it("packages/ui @tiptap and radix-ui pins match drift map", () => {
    const ui = readManifest("packages/ui/package.json");
    for (const dep of [
      "@tiptap/pm",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-underline",
      "radix-ui",
    ] as const) {
      expect(getDeclaredVersion(ui, dep)).toBe(required.get(dep));
    }
  });
});

describe("security dependency floors script", () => {
  it("documents current minimums for next, supabase, and react", () => {
    const source = readFileSync(
      join(repoRoot, "scripts/check-security-dependency-floors.mjs"),
      "utf8"
    );
    expect(source).toContain('next: "16.2.10"');
    expect(source).toContain('"@supabase/supabase-js": "2.110.0"');
    expect(source).toContain('react: "19.2.7"');
  });
});

describe("dependency inventory doc pins", () => {
  const inventory = readFileSync(
    join(repoRoot, "docs/dependency-inventory.md"),
    "utf8"
  );

  it("lists current supabase, next, and override pins", () => {
    expect(inventory).toContain("^2.110.0");
    expect(inventory).toContain("^16.2.10");
    expect(inventory).toContain("vite@8.1.3");
    expect(inventory).toContain("postcss@8.5.16");
  });
});
