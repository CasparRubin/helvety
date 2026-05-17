import { render } from "@testing-library/react";
import { BookmarkIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { getLucideIcon, renderIcon } from "./icon-renderer";

describe("icon-renderer", () => {
  it("resolves known lucide v1 icons", () => {
    expect(getLucideIcon("check")).toBeTruthy();
    expect(getLucideIcon("star")).toBeTruthy();
  });

  it("maps pocket to bookmark after lucide v1 removed brand icons", () => {
    expect(getLucideIcon("pocket")).toBe(BookmarkIcon);
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
