import { openMenuTrigger } from "@helvety/shared/test-utils/base-ui-test-helpers";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductFilters } from "./product-filters";

/** Returns the mobile dropdown trigger (md:hidden), not the desktop filter row. */
function getMobileFilterTrigger(label: RegExp): HTMLElement {
  const triggers = screen.getAllByRole("button", { name: label });
  const mobile = triggers.find((el) => el.classList.contains("md:hidden"));
  expect(mobile).toBeDefined();
  return mobile!;
}

describe("ProductFilters", () => {
  it("desktop row invokes onChange directly", () => {
    const onChange = vi.fn();
    render(<ProductFilters value="all" onChange={onChange} />);

    const desktopButtons = screen
      .getAllByRole("button", { name: /Software/i })
      .filter((el) => !el.classList.contains("md:hidden"));
    fireEvent.click(desktopButtons[0]!);

    expect(onChange).toHaveBeenCalledWith("software");
  });

  it("mobile dropdown selects a filter via menuitem", async () => {
    const onChange = vi.fn();
    render(<ProductFilters value="all" onChange={onChange} />);

    openMenuTrigger(getMobileFilterTrigger(/All Products/i));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Software/i }));

    expect(onChange).toHaveBeenCalledWith("software");
  });
});
