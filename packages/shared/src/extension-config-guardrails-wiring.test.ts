import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..", "..");
const guardrailsPath = join(
  repoRoot,
  "scripts",
  "check-consistency-guardrails.mjs"
);
const guardrailsSource = readFileSync(guardrailsPath, "utf8");
const extensionRoot = join(
  repoRoot,
  "..",
  "helvety-browser-extension-chromium"
);
const extensionSiblingPresent = existsSync(extensionRoot);

/** Runs the monorepo consistency guardrails script from repo root. */
function runGuardrails(): string {
  return execFileSync(process.execPath, [guardrailsPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

describe("consistency guardrails extension config wiring (source)", () => {
  it("blocks reintroduction of abandoned QR and Compress zone scaffolds", () => {
    expect(guardrailsSource).toContain('"apps/qr"');
    expect(guardrailsSource).toContain('"apps/compress"');
    expect(guardrailsSource).toMatch(/forbiddenAppDirs/);
  });

  it("requires extension tsconfig, vitest factory, env.example, and test:coverage", () => {
    expect(guardrailsSource).toContain(
      "@helvety/config/tsconfig.extension.json"
    );
    expect(guardrailsSource).toContain("createExtensionVitestConfig");
    expect(guardrailsSource).toContain("@helvety/config/vitest-extension");
    expect(guardrailsSource).toContain("env.example");
    expect(guardrailsSource).toContain("test:coverage");
  });
});

describe("consistency guardrails abandoned zone enforcement", () => {
  it("fails when apps/qr exists", () => {
    const qrPath = join(repoRoot, "apps/qr");
    mkdirSync(qrPath, { recursive: true });
    try {
      expect(() => runGuardrails()).toThrow(/apps\/qr must not exist/);
    } finally {
      rmSync(qrPath, { recursive: true, force: true });
    }
  });

  it("fails when apps/compress exists", () => {
    const compressPath = join(repoRoot, "apps/compress");
    mkdirSync(compressPath, { recursive: true });
    try {
      expect(() => runGuardrails()).toThrow(/apps\/compress must not exist/);
    } finally {
      rmSync(compressPath, { recursive: true, force: true });
    }
  });
});

describe("consistency guardrails extension sibling repo wiring", () => {
  it.skipIf(!extensionSiblingPresent)(
    "extension repo matches monorepo guardrail expectations",
    () => {
      const tsconfig = JSON.parse(
        readFileSync(join(extensionRoot, "tsconfig.json"), "utf8")
      ) as { extends?: string };
      const vitestConfig = readFileSync(
        join(extensionRoot, "vitest.config.ts"),
        "utf8"
      );
      const packageJson = JSON.parse(
        readFileSync(join(extensionRoot, "package.json"), "utf8")
      ) as { scripts?: Record<string, string> };

      expect(tsconfig.extends).toBe("@helvety/config/tsconfig.extension.json");
      expect(vitestConfig).toContain("createExtensionVitestConfig");
      expect(vitestConfig).toContain("@helvety/config/vitest-extension");
      expect(existsSync(join(extensionRoot, "env.example"))).toBe(true);
      expect(packageJson.scripts?.["test:coverage"]).toBeTruthy();
    }
  );
});
