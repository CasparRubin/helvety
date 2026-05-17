import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { E2eeEntityDetailSheet } from "./e2ee-entity-detail-sheet";

describe("E2eeEntityDetailSheet", () => {
  it("renders the sheet title, default description, and children when open", () => {
    render(
      <E2eeEntityDetailSheet
        open
        onOpenChange={vi.fn()}
        title="Note Details"
        entityId="note-1"
      >
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
        entityId="contact-1"
      >
        <p>Editor</p>
      </E2eeEntityDetailSheet>
    );

    expect(
      screen.getByText("Edit contact fields and linked notes.")
    ).toHaveAttribute("data-slot", "sheet-description");
    expect(screen.queryByText("Edit Contact")).not.toBeInTheDocument();
  });
});
