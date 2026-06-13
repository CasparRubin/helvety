import { describe, expect, it } from "vitest";

import {
  SHEET_SCROLLABLE_BODY_CLASS,
  SHEET_SCROLLABLE_SHELL_CLASS,
} from "./sheet-scroll-layout";

describe("sheet-scroll-layout", () => {
  it("defines a full-height scrollable sheet shell", () => {
    expect(SHEET_SCROLLABLE_SHELL_CLASS).toContain("flex");
    expect(SHEET_SCROLLABLE_SHELL_CLASS).toContain("h-full");
    expect(SHEET_SCROLLABLE_SHELL_CLASS).toContain("flex-col");
    expect(SHEET_SCROLLABLE_SHELL_CLASS).toContain("gap-0");
    expect(SHEET_SCROLLABLE_SHELL_CLASS).toContain("overflow-hidden");
    expect(SHEET_SCROLLABLE_SHELL_CLASS).toContain("p-0");
  });

  it("defines a flex body wrapper that completes the height chain", () => {
    expect(SHEET_SCROLLABLE_BODY_CLASS).toContain("flex");
    expect(SHEET_SCROLLABLE_BODY_CLASS).toContain("min-h-0");
    expect(SHEET_SCROLLABLE_BODY_CLASS).toContain("flex-1");
    expect(SHEET_SCROLLABLE_BODY_CLASS).toContain("flex-col");
    expect(SHEET_SCROLLABLE_BODY_CLASS).toContain("overflow-hidden");
  });
});
