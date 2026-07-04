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

describe("icon-renderer", () => {
  it("package.json pins lucide-react ^1.23 for drift alignment", () => {
    const pkg = JSON.parse(readFileSync(uiPackagePath, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.["lucide-react"]).toBe("^1.23.0");
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
