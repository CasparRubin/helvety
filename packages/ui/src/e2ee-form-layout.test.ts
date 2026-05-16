import { describe, expect, it } from "vitest";

import {
  E2EE_CREATE_DIALOG_FIELDS_CLASS,
  E2EE_CREATE_DIALOG_FIELDS_STACK_CLASS,
  E2EE_EDITOR_FORM_BODY_CLASS,
  E2EE_EDITOR_FORM_BODY_STACK_CLASS,
  E2EE_EDITOR_FORM_FIELDS_STACK_CLASS,
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

  it("uses gap-4 between create-dialog field groups", () => {
    expect(E2EE_CREATE_DIALOG_FIELDS_STACK_CLASS).toContain("gap-4");
    expect(E2EE_CREATE_DIALOG_FIELDS_CLASS).toContain("gap-4");
  });

  it("editor body classes include container padding", () => {
    expect(E2EE_EDITOR_FORM_BODY_CLASS).toContain("px-4 py-8");
    expect(E2EE_EDITOR_FORM_BODY_STACK_CLASS).toContain("px-4 py-8");
  });
});
