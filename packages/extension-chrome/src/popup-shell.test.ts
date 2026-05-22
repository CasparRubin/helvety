import { describe, expect, it } from "vitest";

import {
  POPUP_SHELL_CLASS,
  POPUP_TAB_TRIGGER_ICON_CLASS,
  POPUP_WIDTH_CLASS,
  popupChoiceRowClass,
} from "./popup-shell";

describe("popup-shell", () => {
  it("exports canonical popup width and shell classes", () => {
    expect(POPUP_WIDTH_CLASS).toBe("w-[320px]");
    expect(POPUP_SHELL_CLASS).toContain("px-3");
    expect(POPUP_TAB_TRIGGER_ICON_CLASS).toContain("rounded-none");
  });

  it("popupChoiceRowClass highlights selected rows", () => {
    expect(popupChoiceRowClass(true)).toContain("bg-muted");
    expect(popupChoiceRowClass(false)).toContain("hover:bg-muted/60");
  });
});
