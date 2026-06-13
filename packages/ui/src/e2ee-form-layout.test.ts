import { describe, expect, it } from "vitest";

import {
  E2EE_EDITOR_FORM_BODY_CLASS,
  E2EE_EDITOR_FORM_BODY_STACK_CLASS,
  E2EE_EDITOR_FORM_FIELDS_STACK_CLASS,
  E2EE_ENTITY_SHEET_CONTENT_CLASS,
  E2EE_FORM_FIELD_CLASS,
} from "./e2ee-form-layout";

describe("e2ee-form-layout", () => {
  it("uses gap-2 within field groups", () => {
    expect(E2EE_FORM_FIELD_CLASS).toContain("gap-2");
  });

  it("uses gap-6 between editor field groups", () => {
    expect(E2EE_EDITOR_FORM_FIELDS_STACK_CLASS).toContain("gap-6");
    expect(E2EE_EDITOR_FORM_BODY_STACK_CLASS).toContain("gap-6");
  });

  it("editor body classes include container padding", () => {
    expect(E2EE_EDITOR_FORM_BODY_CLASS).toContain("px-4 py-8");
    expect(E2EE_EDITOR_FORM_BODY_STACK_CLASS).toContain("px-4 py-8");
  });

  it("entity sheet content class matches wide right sheet layout", () => {
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("h-full");
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("w-full");
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("sm:max-w-[95vw]");
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("2xl:max-w-[1800px]");
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("gap-0");
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("overflow-hidden");
    expect(E2EE_ENTITY_SHEET_CONTENT_CLASS).toContain("p-0");
  });
});
