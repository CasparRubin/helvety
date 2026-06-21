import { describe, expect, it } from "vitest";

import {
  FORM_CONTROL_PROSE_SIZE_CLASS,
  FORM_CONTROL_TEXT_SIZE_CLASS,
} from "./form-control-text-size";

describe("form-control-text-size constants", () => {
  it("FORM_CONTROL_TEXT_SIZE_CLASS uses 16px on touch and 14px on fine pointer desktop", () => {
    expect(FORM_CONTROL_TEXT_SIZE_CLASS).toContain("text-base");
    expect(FORM_CONTROL_TEXT_SIZE_CLASS).toContain("pointer:fine");
    expect(FORM_CONTROL_TEXT_SIZE_CLASS).toContain("text-sm");
    expect(FORM_CONTROL_TEXT_SIZE_CLASS).not.toContain("md:text-sm");
  });

  it("FORM_CONTROL_PROSE_SIZE_CLASS mirrors touch-aware prose sizing for rich text", () => {
    expect(FORM_CONTROL_PROSE_SIZE_CLASS).toContain("prose-base");
    expect(FORM_CONTROL_PROSE_SIZE_CLASS).toContain("pointer:fine");
    expect(FORM_CONTROL_PROSE_SIZE_CLASS).toContain("]:prose-sm");
    expect(FORM_CONTROL_PROSE_SIZE_CLASS).not.toMatch(/^prose prose-sm/);
  });
});
