import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getLucideIcon, renderIcon } from "./icon-renderer";

const uiPackagePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../package.json"
);
const driftConfigPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../scripts/workspace-version-drift.config.json"
);

describe("icon-renderer", () => {
  it("package.json keeps lucide-react aligned with the drift config", () => {
    const pkg = JSON.parse(readFileSync(uiPackagePath, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const driftConfig = JSON.parse(readFileSync(driftConfigPath, "utf8")) as {
      requiredVersionByDep?: Record<string, string>;
    };

    expect(pkg.dependencies?.["lucide-react"]).toBe(
      driftConfig.requiredVersionByDep?.["lucide-react"]
    );
  });

  it("resolves known lucide v1 icons", () => {
    expect(getLucideIcon("check")).toBeTruthy();
    expect(getLucideIcon("star")).toBeTruthy();
  });

  it("falls back to circle for unknown icon names", () => {
    expect(getLucideIcon("not-a-real-icon-name-xyz")).toBe(
      getLucideIcon("circle")
    );
  });

  it("renders icons without throwing", () => {
    const { container } = render(renderIcon("star", "size-4"));
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
