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
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@supabase/supabase-js",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-underline",
      "@base-ui/react",
      "lucide-react",
      "next",
      "react",
      "react-dom",
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

  it("packages/ui @tiptap and @base-ui/react pins match drift map", () => {
    const ui = readManifest("packages/ui/package.json");
    for (const dep of [
      "@tiptap/pm",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-underline",
      "@base-ui/react",
    ] as const) {
      expect(getDeclaredVersion(ui, dep)).toBe(required.get(dep));
    }
  });
});

describe("security dependency floors script", () => {
  it("tracks canonical next, supabase, and react minimums", () => {
    const source = readFileSync(
      join(repoRoot, "scripts/check-security-dependency-floors.mjs"),
      "utf8"
    );
    const required = parseDriftRequiredVersions();
    const root = readManifest("package.json");
    const minimum = (dependencyName: string): string => {
      const specifier = required.get(dependencyName);
      if (!specifier) {
        throw new Error(`Missing drift version for ${dependencyName}`);
      }
      return specifier.replace(/^[~^]/, "");
    };

    expect(source).toContain(`next: "${minimum("next")}"`);
    expect(source).toContain(`react: "${minimum("react")}"`);
    expect(source).toContain(
      `"@supabase/supabase-js": "${root.overrides?.["@supabase/supabase-js"]}"`
    );
  });
});

describe("dependency inventory doc pins", () => {
  const inventory = readFileSync(
    join(repoRoot, "docs/dependency-inventory.md"),
    "utf8"
  );

  it("lists current supabase, next, and override pins", () => {
    const required = parseDriftRequiredVersions();
    const root = readManifest("package.json");

    expect(inventory).toContain(required.get("@supabase/supabase-js"));
    expect(inventory).toContain(required.get("next"));
    expect(inventory).toContain(`vite@${root.overrides?.vite}`);
    expect(inventory).toContain(`postcss@${root.overrides?.postcss}`);
  });
});
