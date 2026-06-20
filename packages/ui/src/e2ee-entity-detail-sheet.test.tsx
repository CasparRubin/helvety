import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { E2eeEntityDetailSheet } from "./e2ee-entity-detail-sheet";
import { SHEET_SCROLLABLE_BODY_CLASS } from "./sheet-scroll-layout";

describe("E2eeEntityDetailSheet", () => {
  it("renders the sheet title, default description, and children when open", () => {
    render(
      <E2eeEntityDetailSheet open onOpenChange={vi.fn()} title="Note Details">
        <p>Editor body</p>
      </E2eeEntityDetailSheet>
    );

    expect(screen.getByText("Note Details")).toBeInTheDocument();
    expect(screen.getByText("Edit Note Details")).toHaveAttribute(
      "data-slot",
      "sheet-description"
    );
    expect(screen.getByText("Editor body")).toBeInTheDocument();
  });

  it("uses a custom screen-reader description when provided", () => {
    render(
      <E2eeEntityDetailSheet
        open
        onOpenChange={vi.fn()}
        title="Contact"
        description="Edit contact fields and linked notes."
      >
        <p>Editor</p>
      </E2eeEntityDetailSheet>
    );

    expect(
      screen.getByText("Edit contact fields and linked notes.")
    ).toHaveAttribute("data-slot", "sheet-description");
    expect(screen.queryByText("Edit Contact")).not.toBeInTheDocument();
  });

  it("uses a flex height chain on sheet content and body wrapper for scroll", () => {
    render(
      <E2eeEntityDetailSheet open onOpenChange={vi.fn()} title="Task Details">
        <p data-testid="editor">Editor body</p>
      </E2eeEntityDetailSheet>
    );

    const sheetContent = document.body.querySelector(
      '[data-slot="sheet-content"]'
    );
    expect(sheetContent).not.toBeNull();
    expect(sheetContent?.className).toContain("gap-0");
    expect(sheetContent?.className).toContain("overflow-hidden");
    expect(sheetContent?.className).toContain("p-0");

    const bodyWrapper = sheetContent?.querySelector(
      '[data-slot="sheet-header"] + div'
    );
    for (const token of SHEET_SCROLLABLE_BODY_CLASS.split(/\s+/)) {
      expect(bodyWrapper?.className).toContain(token);
    }
    expect(screen.getByTestId("editor")).toBeInTheDocument();
  });
});
