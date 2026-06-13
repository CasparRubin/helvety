import { describe, expect, it } from "vitest";

import { verifyWorkspaceScriptParity } from "../../../scripts/check-workspace-script-parity.mjs";

describe("verifyWorkspaceScriptParity", () => {
  it("requires lint:fix when lint is defined", () => {
    expect(
      verifyWorkspaceScriptParity("packages/shared/package.json", {
        lint: "eslint .",
      })
    ).toEqual([
      'packages/shared/package.json: has "lint" but missing "lint:fix"',
    ]);
  });

  it("requires test:coverage when test is defined", () => {
    expect(
      verifyWorkspaceScriptParity("packages/shared/package.json", {
        test: "vitest run",
      })
    ).toEqual([
      'packages/shared/package.json: has "test" but missing "test:coverage"',
    ]);
  });

  it("passes when lint and test parity scripts are present", () => {
    expect(
      verifyWorkspaceScriptParity("packages/shared/package.json", {
        lint: "eslint .",
        "lint:fix": "eslint . --fix",
        test: "vitest run",
        "test:coverage": "vitest run --coverage",
      })
    ).toEqual([]);
  });

  it("ignores workspaces without lint or test scripts", () => {
    expect(
      verifyWorkspaceScriptParity("packages/config/package.json", {
        typecheck: "tsc --noEmit",
      })
    ).toEqual([]);
  });
});
