import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { E2eeEntityDetailSheet } from "./e2ee-entity-detail-sheet";

describe("E2eeEntityDetailSheet", () => {
  it("renders the sheet title and children when open", () => {
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
    expect(screen.getByText("Editor body")).toBeInTheDocument();
  });
});
