import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FORM_CONTROL_TEXT_SIZE_CLASS } from "./form-control-text-size";
import { Input } from "./input";
import { ListSearchField } from "./list-search-field";
import { NativeSelect } from "./native-select";
import { Textarea } from "./textarea";

/** Asserts every token from the shared touch-safe class is present on the element. */
function expectTouchSafeTextSize(element: HTMLElement): void {
  for (const token of FORM_CONTROL_TEXT_SIZE_CLASS.split(/\s+/)) {
    expect(element.className).toContain(token);
  }
}

describe("form control primitives apply touch-safe text sizing", () => {
  it("Input applies FORM_CONTROL_TEXT_SIZE_CLASS", () => {
    render(<Input data-testid="field" placeholder="Title" />);
    expectTouchSafeTextSize(screen.getByTestId("field"));
  });

  it("Textarea applies FORM_CONTROL_TEXT_SIZE_CLASS", () => {
    render(<Textarea data-testid="field" placeholder="Notes" />);
    expectTouchSafeTextSize(screen.getByTestId("field"));
  });

  it("NativeSelect applies FORM_CONTROL_TEXT_SIZE_CLASS", () => {
    render(
      <NativeSelect data-testid="field" defaultValue="a">
        <option value="a">A</option>
      </NativeSelect>
    );
    expectTouchSafeTextSize(screen.getByTestId("field"));
  });

  it("ListSearchField searchbox inherits Input touch-safe sizing", () => {
    render(
      <ListSearchField value="" onChange={() => {}} aria-label="Search items" />
    );
    expectTouchSafeTextSize(screen.getByRole("searchbox"));
  });

  it("merges caller className without dropping touch-safe sizing", () => {
    render(<Input data-testid="field" className="font-mono" />);
    const field = screen.getByTestId("field");
    expectTouchSafeTextSize(field);
    expect(field).toHaveClass("font-mono");
  });
});
