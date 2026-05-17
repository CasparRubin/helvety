import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessibleSheetHeader } from "./accessible-sheet-header";
import { Sheet, SheetContent } from "./sheet";

/** Renders {@link AccessibleSheetHeader} inside an open sheet (Radix Dialog context). */
function renderInSheet(ui: React.ReactElement) {
  return render(
    <Sheet open>
      <SheetContent showCloseButton={false} side="right">
        {ui}
      </SheetContent>
    </Sheet>
  );
}

describe("AccessibleSheetHeader", () => {
  it("renders title and screen-reader-only description for Radix sheet a11y", () => {
    renderInSheet(
      <AccessibleSheetHeader
        title="Menu"
        description="Navigate between Helvety apps."
      />
    );

    expect(screen.getByText("Menu")).toBeInTheDocument();
    const description = screen.getByText("Navigate between Helvety apps.");
    expect(description).toBeInTheDocument();
    expect(description).toHaveAttribute("data-slot", "sheet-description");
    expect(description).toHaveClass("sr-only");
  });
});
