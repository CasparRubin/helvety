import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CUSTOMER_COPY_LLMS_RELATIVE_PATHS,
  CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS,
  CUSTOMER_COPY_README_RELATIVE_PATHS,
  CUSTOMER_COPY_USER_FACING_APP_IDS,
  CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS,
} from "./customer-copy-guardrails";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Parses a `const NAME = [ "a", ... ];` string array from a Node script. */
function parseScriptStringArray(source: string, constName: string): string[] {
  const block = source.match(
    new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\];`)
  );
  if (!block?.[1]) {
    throw new Error(`Could not parse const ${constName}`);
  }
  return [...block[1].matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path): path is string => path !== undefined);
}

describe("customer-copy-guardrails path parity", () => {
  const customerCopyScript = readFileSync(
    join(repoRoot, "scripts/check-customer-copy-style.mjs"),
    "utf8"
  );

  it("every declared customer-copy path exists on disk", () => {
    const missing: string[] = [];
    for (const rel of [
      ...CUSTOMER_COPY_README_RELATIVE_PATHS,
      ...CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS,
    ]) {
      if (!existsSync(join(repoRoot, rel))) {
        missing.push(rel);
      }
    }
    expect(missing, missing.join("\n")).toEqual([]);
  });

  it("check-customer-copy-style.mjs README paths match customer-copy-guardrails.ts", () => {
    const scriptPaths = parseScriptStringArray(
      customerCopyScript,
      "README_RELATIVE_PATHS"
    );
    expect([...scriptPaths].sort()).toEqual(
      [...CUSTOMER_COPY_README_RELATIVE_PATHS].sort()
    );
  });

  it("check-customer-copy-style.mjs explicit paths match CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS", () => {
    const scriptPaths = parseScriptStringArray(
      customerCopyScript,
      "EXPLICIT_RELATIVE_PATHS"
    );
    expect([...scriptPaths].sort()).toEqual(
      [...CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS].sort()
    );
  });

  it("check-customer-copy-style.mjs app ids match CUSTOMER_COPY_USER_FACING_APP_IDS", () => {
    const scriptIds = parseScriptStringArray(
      customerCopyScript,
      "USER_FACING_APP_IDS"
    );
    expect(scriptIds).toEqual([...CUSTOMER_COPY_USER_FACING_APP_IDS]);
  });

  it("every apps/*/public/llms.txt is listed in CUSTOMER_COPY_LLMS_RELATIVE_PATHS", () => {
    const appsDir = join(repoRoot, "apps");
    const listed = new Set<string>(CUSTOMER_COPY_LLMS_RELATIVE_PATHS);
    const discovered: string[] = [];
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = `apps/${entry.name}/public/llms.txt`;
      if (existsSync(join(repoRoot, rel))) {
        discovered.push(rel);
      }
    }
    const missingFromGuardrails = discovered.filter((rel) => !listed.has(rel));
    expect(missingFromGuardrails, missingFromGuardrails.join("\n")).toEqual([]);
  });

  it("every apps/*/public/manifest.json is listed in CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS", () => {
    const appsDir = join(repoRoot, "apps");
    const listed = new Set<string>(CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS);
    const discovered: string[] = [];
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = `apps/${entry.name}/public/manifest.json`;
      if (existsSync(join(repoRoot, rel))) {
        discovered.push(rel);
      }
    }
    const missingFromGuardrails = discovered.filter((rel) => !listed.has(rel));
    expect(missingFromGuardrails, missingFromGuardrails.join("\n")).toEqual([]);
  });
});
