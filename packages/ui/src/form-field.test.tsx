import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { E2EE_FORM_FIELD_CLASS } from "./e2ee-form-layout";
import { FormField } from "./form-field";
import { Input } from "./input";

describe("FormField", () => {
  it("renders a label linked to the control id", () => {
    render(
      <FormField label="Title" id="task-title">
        <Input />
      </FormField>
    );

    const input = screen.getByLabelText("Title");
    expect(input).toHaveAttribute("id", "task-title");
  });

  it("marks required fields with an asterisk", () => {
    render(
      <FormField label="Title" required id="task-title">
        <Input />
      </FormField>
    );

    expect(screen.getByText("Title *")).toBeInTheDocument();
  });

  it("uses shared E2EE field spacing", () => {
    const { container } = render(
      <FormField label="Email" id="contact-email">
        <Input />
      </FormField>
    );

    const fieldGroup = container.firstElementChild;
    expect(fieldGroup).toHaveClass(...E2EE_FORM_FIELD_CLASS.split(/\s+/));
  });

  it("auto-generates an id when none is provided", () => {
    render(
      <FormField label="Notes">
        <Input />
      </FormField>
    );

    const input = screen.getByLabelText("Notes");
    expect(input).toHaveAttribute("id");
    expect(input.getAttribute("id")).not.toBe("");
  });
});
